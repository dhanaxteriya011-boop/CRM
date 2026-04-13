<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckSubscription
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) return $next($request);

        // Super-admin bypass (optional — for system owner)
        if ($user->hasRole('Admin')) {
            $sub = $user->getActiveSubscription();
            if (!$sub || !$sub->isActive()) {
                return response()->json([
                    'message' => 'Your subscription has expired. Please renew to continue.',
                    'expired' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}