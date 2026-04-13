<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MemberController extends Controller
{
    /** List all members under this admin */
    public function index(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);

        $members = $request->user()->managedMembers()
            ->with('roles')
            ->when($request->search, fn($q) =>
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('username', 'like', "%{$request->search}%")
            )
            ->latest()
            ->paginate(20);

        return response()->json($members);
    }

    /** Admin adds a new member */
    public function store(Request $request)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);

        // Check subscription member limit
        if (!$request->user()->canAddMoreMembers()) {
            $sub  = $request->user()->getActiveSubscription();
            $plan = $sub?->plan;
            return response()->json([
                'message' => "Member limit reached for your {$plan?->name} plan ({$plan?->max_members} members). Please upgrade.",
                'limit_reached' => true,
            ], 422);
        }

        // Check active subscription exists
        if (!$request->user()->getActiveSubscription()) {
            return response()->json([
                'message' => 'You need an active subscription before adding members.',
                'no_subscription' => true,
            ], 422);
        }

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|unique:users|min:3|max:30|regex:/^[a-zA-Z0-9_]+$/',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:Manager,Sales,Support',
            'email'    => 'nullable|email|unique:users',
            'phone'    => 'nullable|string',
        ]);

        $member = User::create([
            'name'              => $data['name'],
            'username'          => $data['username'],
            'email'             => $data['email'] ?? null,
            'password'          => Hash::make($data['password']),
            'is_active'         => true,
            'created_by_admin'  => $request->user()->id,
        ]);
        $member->assignRole($data['role']);

        return response()->json($member->load('roles'), 201);
    }

    /** Admin updates a member */
    public function update(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);
        if ($user->created_by_admin !== $request->user()->id) abort(403, 'Not your member');

        $data = $request->validate([
            'name'      => 'sometimes|required|string',
            'username'  => "sometimes|required|unique:users,username,{$user->id}|min:3|regex:/^[a-zA-Z0-9_]+$/",
            'password'  => 'sometimes|nullable|string|min:6',
            'role'      => 'sometimes|in:Manager,Sales,Support',
            'is_active' => 'sometimes|boolean',
            'email'     => "sometimes|nullable|email|unique:users,email,{$user->id}",
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (!empty($data['role'])) {
            $user->syncRoles([$data['role']]);
            unset($data['role']);
        }

        $user->update($data);
        return response()->json($user->load('roles'));
    }

    /** Admin deactivates/deletes a member */
    public function destroy(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);
        if ($user->created_by_admin !== $request->user()->id) abort(403, 'Not your member');

        $user->update(['is_active' => false]);
        return response()->json(['message' => 'Member deactivated']);
    }

    /** Admin resets a member's password */
    public function resetPassword(Request $request, User $user)
    {
        if (!$request->user()->hasRole('Admin')) abort(403);
        if ($user->created_by_admin !== $request->user()->id) abort(403, 'Not your member');

        $data = $request->validate([
            'password' => 'required|string|min:6',
        ]);

        $user->update(['password' => Hash::make($data['password'])]);
        return response()->json(['message' => 'Password reset successfully']);
    }
}