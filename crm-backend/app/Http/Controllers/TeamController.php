<?php
namespace App\Http\Controllers;
use App\Models\Team;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function index()
    {
        return response()->json(Team::with('manager','members.roles')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required', 'manager_id' => 'nullable|exists:users,id']);
        $team = Team::create($data);
        if ($request->members) {
            $team->members()->sync($request->members);
        }
        return response()->json($team->load('manager','members'), 201);
    }

    public function update(Request $request, Team $team)
    {
        $team->update($request->validate(['name' => 'sometimes|required', 'manager_id' => 'nullable|exists:users,id']));
        if ($request->has('members')) {
            $team->members()->sync($request->members);
        }
        return response()->json($team->load('manager','members'));
    }

    public function destroy(Team $team)
    {
        $team->delete();
        return response()->json(['message' => 'Deleted']);
    }
}