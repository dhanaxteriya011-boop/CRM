<?php
namespace App\Http\Controllers;

use App\Models\{Subscription, SubscriptionPlan};
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /** List available plans */
    public function plans()
    {
        return response()->json(SubscriptionPlan::where('active', true)->get());
    }

    /** Admin subscribes to a plan */
    public function subscribe(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);

        $data = $request->validate([
            'plan_id'           => 'required|exists:subscription_plans,id',
            'amount_paid'       => 'required|numeric|min:0',
            'payment_method'    => 'required|in:cash,upi,card,bank,other',
            'payment_reference' => 'nullable|string',
            'months'            => 'required|integer|min:1|max:24',
            'notes'             => 'nullable|string',
        ]);

        $plan = SubscriptionPlan::findOrFail($data['plan_id']);

        // Expire any existing active subscription
        Subscription::where('admin_id', $request->user()->id)
            ->where('status', 'active')
            ->update(['status' => 'superseded']);

        $sub = Subscription::create([
            'admin_id'          => $request->user()->id,
            'plan_id'           => $plan->id,
            'status'            => 'active',
            'started_at'        => now(),
            'expires_at'        => now()->addMonths($data['months']),
            'amount_paid'       => $data['amount_paid'],
            'payment_method'    => $data['payment_method'],
            'payment_reference' => $data['payment_reference'] ?? null,
            'notes'             => $data['notes'] ?? null,
        ]);

        return response()->json($sub->load('plan'), 201);
    }

    /** Get admin's current subscription */
    public function current(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);

        $sub = $request->user()->getActiveSubscription();
        if (!$sub) {
            return response()->json(['subscription' => null, 'message' => 'No active subscription']);
        }

        $memberCount = $request->user()->managedMembers()->count();
        $plan        = $sub->plan;

        return response()->json([
            'subscription'     => $sub->load('plan'),
            'member_count'     => $memberCount,
            'member_limit'     => $plan->isUnlimited() ? 'Unlimited' : $plan->max_members,
            'members_left'     => $plan->isUnlimited() ? 'Unlimited' : max(0, $plan->max_members - $memberCount),
            'days_left'        => $sub->daysLeft(),
            'expires_at'       => $sub->expires_at->toDateString(),
        ]);
    }

    /** Subscription history */
    public function history(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);
        $subs = Subscription::where('admin_id', $request->user()->id)
            ->with('plan')->latest()->get();
        return response()->json($subs);
    }

    /** Cancel subscription */
    public function cancel(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);
        $sub = $request->user()->getActiveSubscription();
        if ($sub) $sub->update(['status' => 'cancelled']);
        return response()->json(['message' => 'Subscription cancelled']);
    }
}