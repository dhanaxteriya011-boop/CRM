<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with('roles')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%"))
            ->paginate(15);
        return response()->json($users);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required', 'email' => 'required|email|unique:users',
            'password' => 'required|min:6', 'role' => 'required|exists:roles,name',
        ]);
        $user = User::create([...$data, 'password' => Hash::make($data['password'])]);
        $user->assignRole($data['role']);
        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load('roles', 'teams'));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => 'sometimes|required', 'email' => "sometimes|required|email|unique:users,email,{$user->id}",
            'role' => 'sometimes|exists:roles,name', 'is_active' => 'sometimes|boolean',
        ]);
        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
            unset($data['role']);
        }
        $user->update($data);
        return response()->json($user->load('roles'));
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function roles()
    {
        return response()->json(Role::all());
    }

    public function activityLog(User $user)
    {
        $activities = $user->activities()->with('related')->latest()->paginate(20);
        return response()->json($activities);
    }
}