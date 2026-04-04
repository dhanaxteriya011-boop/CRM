<?php
namespace App\Http\Controllers;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $activities = Activity::with('user','related')
            ->when($request->type, fn($q) => $q->where('type', $request->type))
            ->when($request->completed !== null, fn($q) => $q->where('completed', $request->boolean('completed')))
            ->where('user_id', auth()->id())
            ->latest('due_at')->paginate(20);
        return response()->json($activities);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:call,meeting,follow-up,email',
            'title' => 'required', 'description' => 'nullable',
            'due_at' => 'nullable|date',
            'related_id' => 'nullable|integer', 'related_type' => 'nullable|string',
        ]);
        $data['user_id'] = auth()->id();
        $activity = Activity::create($data);
        return response()->json($activity, 201);
    }

    public function update(Request $request, Activity $activity)
    {
        $data = $request->validate([
            'title' => 'sometimes|required', 'description' => 'nullable',
            'due_at' => 'nullable|date', 'completed' => 'boolean',
        ]);
        $activity->update($data);
        return response()->json($activity);
    }

    public function destroy(Activity $activity)
    {
        $activity->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function upcoming()
    {
        $activities = Activity::where('user_id', auth()->id())
            ->where('completed', false)
            ->where('due_at', '>=', now())
            ->orderBy('due_at')
            ->take(10)->get();
        return response()->json($activities);
    }
}