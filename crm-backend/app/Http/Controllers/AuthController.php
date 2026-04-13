<?php
namespace App\Http\Controllers;

use App\Models\{User, Subscription, SubscriptionPlan};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * ADMIN SELF-REGISTRATION (only route for self-register)
     * After registering, admin must subscribe to a plan before adding members
     */
    public function adminRegister(Request $request)
    {
        $data = $request->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users',
            'username'              => 'required|string|unique:users|min:3|max:30|regex:/^[a-zA-Z0-9_]+$/',
            'password'              => 'required|string|min:6|confirmed',
            'company_name'          => 'nullable|string',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
        ]);
        $user->assignRole('Admin');

        $token = $user->createToken('crm')->plainTextToken;
        return response()->json(['user' => $user->load('roles'), 'token' => $token], 201);
    }

    /**
     * LOGIN — works for both admin (email or username) and members (username)
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'login'    => 'required|string',    // accepts email OR username
            'password' => 'required|string',
        ]);

        // Try email first, then username
        $user = User::where('email', $data['login'])
            ->orWhere('username', $data['login'])
            ->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['login' => ['Invalid credentials']]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated. Contact your admin.'], 403);
        }

        $token = $user->createToken('crm')->plainTextToken;
        return response()->json([
            'user'  => $user->load('roles', 'adminSubscription.plan'),
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles');
        $sub  = $user->getActiveSubscription();
        return response()->json([
            'user'         => $user,
            'subscription' => $sub?->load('plan'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}