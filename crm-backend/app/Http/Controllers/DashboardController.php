<?php
namespace App\Http\Controllers;
use App\Models\{Contact, Lead, Deal, Activity, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_contacts' => Contact::count(),
            'total_leads' => Lead::count(),
            'total_deals' => Deal::count(),
            'won_deals' => Deal::where('stage', 'Closed Won')->count(),
            'total_revenue' => Deal::where('stage', 'Closed Won')->sum('value'),
            'pending_activities' => Activity::where('completed', false)->where('user_id', auth()->id())->count(),
            'new_leads_this_month' => Lead::whereMonth('created_at', now()->month)->count(),
        ];

        $lead_conversion = [
            'total' => Lead::count(),
            'converted' => Lead::where('status', 'Converted')->count(),
        ];

        $deals_by_stage = Deal::select('stage', DB::raw('count(*) as count'), DB::raw('sum(value) as total'))
            ->groupBy('stage')->get();

        $monthly_revenue = Deal::where('stage', 'Closed Won')
            ->select(DB::raw('MONTH(created_at) as month'), DB::raw('SUM(value) as total'))
            ->whereYear('created_at', now()->year)
            ->groupBy('month')->orderBy('month')->get();

        $leads_by_source = Lead::select('source', DB::raw('count(*) as count'))
            ->groupBy('source')->get();

        $top_sales = User::withCount(['deals as won_deals_count' => fn($q) => $q->where('stage','Closed Won')])
            ->withSum(['deals as revenue' => fn($q) => $q->where('stage','Closed Won')], 'value')
            ->orderByDesc('revenue')->take(5)->get();

        $recent_activities = Activity::with('user','related')->latest()->take(10)->get();

        return response()->json(compact(
            'stats','lead_conversion','deals_by_stage',
            'monthly_revenue','leads_by_source','top_sales','recent_activities'
        ));
    }
}