<?php
namespace App\Http\Controllers;
use App\Models\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'body' => 'required', 'notable_id' => 'required|integer',
            'notable_type' => 'required|in:App\Models\Contact,App\Models\Lead,App\Models\Deal',
        ]);
        $data['user_id'] = auth()->id();
        $note = Note::create($data);
        return response()->json($note->load('user'), 201);
    }

    public function update(Request $request, Note $note)
    {
        $note->update($request->validate(['body' => 'required']));
        return response()->json($note);
    }

    public function destroy(Note $note)
    {
        $note->delete();
        return response()->json(['message' => 'Deleted']);
    }
}