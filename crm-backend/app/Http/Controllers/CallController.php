<?php
namespace App\Http\Controllers;

use App\Models\{CallQueue, CallRoutingRule, User};
use App\Services\CallRoutingService;
use Illuminate\Http\Request;

class CallController extends Controller
{
    public function __construct(private CallRoutingService $router) {}

    // ─── LIST: role-based visibility ───
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = CallQueue::with(['assignedTo', 'attendedBy', 'contact', 'lead', 'team', 'escalatedTo']);

        if ($user->hasRole('Admin')) {
            // Admin: ALL calls, no filter
        } elseif ($user->hasRole('Manager')) {
            // Manager: only their team's calls
            $teamIds = $user->teams()->pluck('teams.id');
            $query->where(function ($q) use ($user, $teamIds) {
                $q->whereIn('team_id', $teamIds)
                  ->orWhere('escalated_to', $user->id);
            });
        } else {
            // Sales / Support: only their own calls
            $query->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                  ->orWhere('attended_by', $user->id);
            });
        }

        // Common filters
        if ($request->status)   $query->where('status', $request->status);
        if ($request->priority !== null) $query->where('priority', $request->priority);
        if ($request->search) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('title', 'like', "%$s%")
                ->orWhere('caller_name', 'like', "%$s%")
                ->orWhere('caller_phone', 'like', "%$s%")
            );
        }
        if ($request->date_from) $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->date_to)   $query->whereDate('created_at', '<=', $request->date_to);

        $calls = $query
            ->orderByRaw("FIELD(status,'assigned','escalated','pending','attended','completed','missed')")
            ->orderByDesc('priority')
            ->orderBy('created_at')
            ->paginate(20);

        return response()->json($calls);
    }

    // ─── MY CALLS (Sales/Support quick view) ───
    public function myCalls(Request $request)
    {
        $calls = CallQueue::with(['contact', 'lead'])
            ->where('assigned_to', $request->user()->id)
            ->whereIn('status', ['assigned', 'attended', 'escalated'])
            ->orderByDesc('priority')
            ->orderBy('timeout_at')
            ->get();

        return response()->json($calls);
    }

    // ─── CREATE ───
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'           => 'required|string',
            'caller_name'     => 'nullable|string',
            'caller_phone'    => 'nullable|string',
            'contact_id'      => 'nullable|exists:contacts,id',
            'lead_id'         => 'nullable|exists:leads,id',
            'team_id'         => 'nullable|exists:teams,id',
            'routing_type'    => 'nullable|in:round-robin,priority,first-available',
            'priority'        => 'nullable|integer|in:0,1,2',
            'notes'           => 'nullable|string',
            'source'          => 'nullable|string',
            'timeout_minutes' => 'nullable|integer|min:1|max:60',
            'max_attempts'    => 'nullable|integer|min:1|max:10',
        ]);

        $call = $this->router->createCall($data);
        return response()->json($call, 201);
    }

    // ─── SHOW ───
    public function show(Request $request, CallQueue $callQueue)
    {
        $this->checkAccess($callQueue, $request->user());
        return response()->json(
            $callQueue->load(['assignedTo', 'attendedBy', 'escalatedTo', 'contact', 'lead', 'team', 'assignments.user', 'logs.user'])
        );
    }

    // ─── ATTEND (Sales/Support) ───
    public function attend(Request $request, CallQueue $callQueue)
    {
        $call = $this->router->attendCall($callQueue, $request->user());
        return response()->json($call);
    }

    // ─── DECLINE (Sales/Support) ───
    public function decline(Request $request, CallQueue $callQueue)
    {
        $data = $request->validate(['reason' => 'nullable|string']);
        $this->router->declineCall($callQueue, $request->user(), $data['reason'] ?? 'declined');
        return response()->json(['message' => 'Declined, reassigning to next person...']);
    }

    // ─── COMPLETE WITH FULL REPORT ───
    public function complete(Request $request, CallQueue $callQueue)
    {
        $data = $request->validate([
            'outcome'     => 'required|in:answered,voicemail,callback,no-answer,wrong-number',
            'notes'       => 'nullable|string',
            'next_action' => 'nullable|in:follow-up,send-email,close,escalate',
        ]);

        $call = $this->router->completeCall($callQueue, $request->user(), $data);
        return response()->json($call);
    }

    // ─── REASSIGN (Manager/Admin only) ───
    public function reassign(Request $request, CallQueue $callQueue)
    {
        if (!$request->user()->hasAnyRole(['Admin', 'Manager'])) abort(403);

        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason'  => 'nullable|string',
        ]);

        $call = $this->router->reassignCall($callQueue, $data['user_id'], $data['reason'] ?? '');
        return response()->json($call);
    }

    // ─── ESCALATE (Manager/Admin only) ───
    public function escalate(Request $request, CallQueue $callQueue)
    {
        if (!$request->user()->hasAnyRole(['Admin', 'Manager'])) abort(403);

        $data = $request->validate([
            'escalate_to' => 'required|exists:users,id',
            'reason'      => 'required|string',
        ]);

        $callQueue->update([
            'status'            => 'escalated',
            'escalated_to'      => $data['escalate_to'],
            'escalated_at'      => now(),
            'escalation_reason' => $data['reason'],
        ]);

        User::findOrFail($data['escalate_to'])
            ->notify(new \App\Notifications\CallEscalatedNotification($callQueue));

        return response()->json($callQueue->fresh(['escalatedTo']));
    }

    // ─── HISTORY / AUDIT TRAIL ───
    public function history(Request $request, CallQueue $callQueue)
    {
        $this->checkAccess($callQueue, $request->user());
        return response()->json([
            'assignments' => $callQueue->assignments()->with('user')->orderBy('assigned_at')->get(),
            'logs'        => $callQueue->logs()->with('user')->get(),
        ]);
    }

    // ─── STATS (Admin/Manager only) ───
    public function stats(Request $request)
    {
        if (!$request->user()->hasAnyRole(['Admin', 'Manager'])) abort(403);

        $from = $request->date_from ?? now()->startOfMonth();
        $to   = $request->date_to   ?? now()->endOfMonth();

        $base = fn() => CallQueue::whereBetween('created_at', [$from, $to]);

        // Manager: limit to their team
        if ($request->user()->hasRole('Manager') && !$request->user()->hasRole('Admin')) {
            $teamIds = $request->user()->teams()->pluck('teams.id');
            $base = fn() => CallQueue::whereBetween('created_at', [$from, $to])->whereIn('team_id', $teamIds);
        }

        $total     = $base()->count();
        $completed = $base()->where('status', 'completed')->count();
        $missed    = $base()->where('status', 'missed')->count();
        $escalated = $base()->where('status', 'escalated')->count();

        $byStatus = $base()->selectRaw('status, count(*) as count')->groupBy('status')->get();

        $byUser = $base()->where('status', 'completed')
            ->selectRaw('attended_by, count(*) as calls_completed')
            ->with('attendedBy:id,name')
            ->groupBy('attended_by')->get();

        $byRouting = $base()->selectRaw('routing_type, count(*) as count')->groupBy('routing_type')->get();

        $avgDuration = \App\Models\CallLog::whereBetween('created_at', [$from, $to])
            ->avg('duration_seconds');

        return response()->json([
            'total'        => $total,
            'completed'    => $completed,
            'missed'       => $missed,
            'escalated'    => $escalated,
            'pending'      => $base()->whereIn('status', ['pending','assigned'])->count(),
            'missed_rate'  => $total > 0 ? round($missed / $total * 100, 1) . '%' : '0%',
            'avg_duration' => $avgDuration ? gmdate('i:s', $avgDuration) : 'N/A',
            'by_status'    => $byStatus,
            'by_user'      => $byUser,
            'by_routing'   => $byRouting,
        ]);
    }

    // ─── ROUTING RULES (Admin only) ───
    public function getRoutingRules()
    {
        return response()->json(CallRoutingRule::with('team')->get());
    }

    public function saveRoutingRule(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);

        $data = $request->validate([
            'team_id'             => 'nullable|exists:teams,id',
            'routing_type'        => 'required|in:round-robin,priority,first-available',
            'timeout_minutes'     => 'required|integer|min:1|max:60',
            'max_attempts'        => 'required|integer|min:1|max:10',
            'escalate_to_manager' => 'boolean',
            'user_order'          => 'nullable|array',
            'active'              => 'boolean',
        ]);

        $rule = CallRoutingRule::updateOrCreate(['team_id' => $data['team_id'] ?? null], $data);
        return response()->json($rule->load('team'), 201);
    }

    // ─── PRIVATE ───
    private function checkAccess(CallQueue $call, User $user): void
    {
        if ($user->hasRole('Admin')) return;

        if ($user->hasRole('Manager')) {
            $teamIds = $user->teams()->pluck('teams.id')->toArray();
            if (in_array($call->team_id, $teamIds) || $call->escalated_to === $user->id) return;
            abort(403);
        }

        // Sales / Support
        if ($call->assigned_to !== $user->id && $call->attended_by !== $user->id) {
            abort(403, 'You can only view your own calls');
        }
    }
}