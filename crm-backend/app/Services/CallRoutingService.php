<?php
namespace App\Services;

use App\Models\{CallQueue, CallAssignment, CallLog, CallRoutingRule, User, Team};
use App\Notifications\{CallAssignedNotification, CallEscalatedNotification, CallMissedNotification, CallCompletedNotification};
use Illuminate\Support\Facades\DB;

class CallRoutingService
{
    /**
     * Create call and route to first person
     */
    public function createCall(array $data): CallQueue
    {
        return DB::transaction(function () use ($data) {
            // Pull routing rule defaults
            if (!empty($data['team_id'])) {
                $rule = CallRoutingRule::where('team_id', $data['team_id'])->where('active', true)->first();
                if ($rule) {
                    $data['routing_type']    = $data['routing_type'] ?? $rule->routing_type;
                    $data['timeout_minutes'] = $data['timeout_minutes'] ?? $rule->timeout_minutes;
                    $data['max_attempts']    = $data['max_attempts'] ?? $rule->max_attempts;
                }
            }

            $call = CallQueue::create([...$data, 'status' => 'pending', 'current_attempt' => 0]);
            $this->assignNext($call);
            return $call->fresh(['assignedTo', 'contact', 'lead', 'team']);
        });
    }

    /**
     * Core: pick next user based on routing type
     */
    public function assignNext(CallQueue $call): void
    {
        $nextUser = match($call->routing_type) {
            'priority'        => $this->getNextByPriority($call),
            'first-available' => $this->getFirstAvailable($call),
            default           => $this->getNextRoundRobin($call),
        };

        if (!$nextUser) {
            $this->escalateOrMiss($call);
            return;
        }

        $call->increment('current_attempt');

        // Close previous pending assignment
        CallAssignment::where('call_queue_id', $call->id)
            ->where('status', 'pending')
            ->update(['status' => 'missed', 'responded_at' => now(), 'miss_reason' => 'timeout']);

        $timeoutAt = now()->addMinutes($call->timeout_minutes ?? 5);

        CallAssignment::create([
            'call_queue_id'  => $call->id,
            'user_id'        => $nextUser->id,
            'attempt_number' => $call->current_attempt,
            'status'         => 'pending',
            'assigned_at'    => now(),
            'timeout_at'     => $timeoutAt,
        ]);

        $call->update([
            'status'      => 'assigned',
            'assigned_to' => $nextUser->id,
            'assigned_at' => now(),
            'timeout_at'  => $timeoutAt,
        ]);

        $nextUser->notify(new CallAssignedNotification($call));
    }

    // ─── ROUTING STRATEGY 1: ROUND-ROBIN ───
    private function getNextRoundRobin(CallQueue $call): ?User
    {
        $triedIds = $this->triedUserIds($call);
        $pool     = $this->getCandidatePool($call, $triedIds);
        if ($pool->isEmpty()) return null;

        $rule = $this->getRule($call);
        if ($rule) {
            // Track rotation index in the rule
            $idx  = $rule->last_assigned_index % $pool->count();
            $rule->increment('last_assigned_index');
            return $pool[$idx];
        }

        return $pool->first();
    }

    // ─── ROUTING STRATEGY 2: PRIORITY ORDER ───
    private function getNextByPriority(CallQueue $call): ?User
    {
        $triedIds = $this->triedUserIds($call);
        $rule     = $this->getRule($call);

        if ($rule && !empty($rule->user_order)) {
            // user_order is an array of user IDs in priority sequence
            foreach ($rule->user_order as $userId) {
                if (!in_array($userId, $triedIds)) {
                    return User::find($userId);
                }
            }
            return null;
        }

        // Fallback: use team member order by ID if no explicit order set
        return $this->getCandidatePool($call, $triedIds)->first();
    }

    // ─── ROUTING STRATEGY 3: FIRST-AVAILABLE ───
    private function getFirstAvailable(CallQueue $call): ?User
    {
        $triedIds = $this->triedUserIds($call);
        $pool     = $this->getCandidatePool($call, $triedIds);

        // "Available" = user has 0 active (assigned/attended) calls right now
        return $pool->filter(function (User $user) {
            $activeCallCount = CallQueue::where('assigned_to', $user->id)
                ->whereIn('status', ['assigned', 'attended'])
                ->count();
            return $activeCallCount === 0;
        })->first()
        // If nobody is free, fall back to the person with fewest active calls
        ?? $pool->sortBy(function (User $user) {
            return CallQueue::where('assigned_to', $user->id)
                ->whereIn('status', ['assigned', 'attended'])
                ->count();
        })->first();
    }

    // ─── SHARED HELPERS ───

    private function triedUserIds(CallQueue $call): array
    {
        return CallAssignment::where('call_queue_id', $call->id)->pluck('user_id')->toArray();
    }

    private function getCandidatePool(CallQueue $call, array $excludeIds)
    {
        if ($call->team_id) {
            return $call->team->members()
                ->whereNotIn('users.id', $excludeIds)
                ->whereHas('roles', fn($q) => $q->whereIn('name', ['Sales', 'Support', 'Manager']))
                ->get();
        }

        return User::role(['Sales', 'Support'])
            ->whereNotIn('id', $excludeIds)
            ->get();
    }

    private function getRule(CallQueue $call): ?CallRoutingRule
    {
        return CallRoutingRule::where('team_id', $call->team_id)->where('active', true)->first();
    }

    /**
     * Handle auto-timeout
     */
    public function handleTimeout(CallQueue $call): void
    {
        if (!$call->isTimedOut()) return;

        $rule        = $this->getRule($call);
        $maxAttempts = $rule?->max_attempts ?? $call->max_attempts ?? 3;

        if ($call->current_attempt >= $maxAttempts) {
            $this->escalateOrMiss($call);
        } else {
            $this->assignNext($call);
        }
    }

    /**
     * User attends their assigned call
     */
    public function attendCall(CallQueue $call, User $user): CallQueue
    {
        if ($call->assigned_to !== $user->id) {
            abort(403, 'This call is not assigned to you');
        }
        if (!in_array($call->status, ['assigned', 'ringing'])) {
            abort(422, 'Call cannot be attended now. Status: ' . $call->status);
        }

        DB::transaction(function () use ($call, $user) {
            CallAssignment::where('call_queue_id', $call->id)
                ->where('user_id', $user->id)->where('status', 'pending')
                ->update(['status' => 'attended', 'responded_at' => now()]);

            $call->update([
                'status'      => 'attended',
                'attended_by' => $user->id,
                'attended_at' => now(),
            ]);
        });

        return $call->fresh(['attendedBy', 'contact', 'assignedTo']);
    }

    /**
     * Complete call with full report
     */
    public function completeCall(CallQueue $call, User $user, array $report): CallQueue
    {
        $canComplete = $call->attended_by === $user->id
            || $user->hasRole('Admin')
            || $user->hasRole('Manager');

        if (!$canComplete) abort(403, 'You cannot complete this call');

        DB::transaction(function () use ($call, $user, $report) {
            CallLog::create([
                'call_queue_id'    => $call->id,
                'user_id'          => $user->id,
                'started_at'       => $call->attended_at,
                'ended_at'         => now(),
                'duration_seconds' => $call->attended_at
                    ? now()->diffInSeconds($call->attended_at) : null,
                'outcome'          => $report['outcome'],
                'notes'            => $report['notes'] ?? null,
                'next_action'      => $report['next_action'] ?? null,
            ]);

            $call->update([
                'status'       => 'completed',
                'completed_at' => now(),
            ]);

            // Notify manager
            $manager = $this->getTeamManager($call);
            if ($manager) {
                $log = $call->logs()->latest()->first();
                $manager->notify(new CallCompletedNotification($call, $log));
            }
        });

        return $call->fresh(['attendedBy', 'logs', 'contact']);
    }

    /**
     * User declines → immediately reassign
     */
    public function declineCall(CallQueue $call, User $user, string $reason = 'declined'): void
    {
        CallAssignment::where('call_queue_id', $call->id)
            ->where('user_id', $user->id)->where('status', 'pending')
            ->update(['status' => 'missed', 'responded_at' => now(), 'miss_reason' => $reason]);

        $this->assignNext($call);
    }

    /**
     * Manager manually reassigns
     */
    public function reassignCall(CallQueue $call, int $userId, string $reason = ''): CallQueue
    {
        $newUser = User::findOrFail($userId);

        DB::transaction(function () use ($call, $newUser, $reason) {
            CallAssignment::where('call_queue_id', $call->id)->where('status', 'pending')
                ->update(['status' => 'skipped', 'miss_reason' => $reason, 'responded_at' => now()]);

            $timeoutAt = now()->addMinutes($call->timeout_minutes ?? 5);
            CallAssignment::create([
                'call_queue_id'  => $call->id,
                'user_id'        => $newUser->id,
                'attempt_number' => $call->current_attempt + 1,
                'status'         => 'pending',
                'assigned_at'    => now(),
                'timeout_at'     => $timeoutAt,
            ]);

            $call->update([
                'status'      => 'assigned',
                'assigned_to' => $newUser->id,
                'assigned_at' => now(),
                'timeout_at'  => $timeoutAt,
            ]);

            $newUser->notify(new CallAssignedNotification($call));
        });

        return $call->fresh(['assignedTo']);
    }

    private function escalateOrMiss(CallQueue $call): void
    {
        $rule            = $this->getRule($call);
        $shouldEscalate  = $rule ? $rule->escalate_to_manager : true;

        if ($shouldEscalate) {
            $manager = $this->getTeamManager($call);
            if ($manager && !$call->escalated_to) {
                $call->update([
                    'status'            => 'escalated',
                    'escalated_to'      => $manager->id,
                    'escalated_at'      => now(),
                    'escalation_reason' => "All {$call->current_attempt} attempts exhausted",
                ]);
                $manager->notify(new CallEscalatedNotification($call));
                return;
            }
        }

        $call->update(['status' => 'missed']);
        User::role('Admin')->each(fn($u) => $u->notify(new CallMissedNotification($call)));
    }

    private function getTeamManager(CallQueue $call): ?User
    {
        return $call->team_id ? $call->team->manager : User::role('Manager')->first();
    }
}