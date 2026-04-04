<?php
namespace App\Http\Controllers;
use App\Models\Deal;
use Illuminate\Http\Request;

class DealController extends Controller
{
    public function index(Request $request)
    {
        $deals = Deal::with('contact','owner')
            ->when($request->search, fn($q) => $q->where('title','like',"%{$request->search}%"))
            ->when($request->stage, fn($q) => $q->where('stage', $request->stage))
            ->when($request->owner_id, fn($q) => $q->where('owner_id', $request->owner_id))
            ->latest()->paginate(15);
        return response()->json($deals);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required', 'contact_id' => 'nullable|exists:contacts,id',
            'lead_id' => 'nullable|exists:leads,id',
            'stage' => 'nullable|in:Prospecting,Proposal,Negotiation,Closed Won,Closed Lost',
            'value' => 'nullable|numeric', 'expected_close_date' => 'nullable|date',
        ]);
        $data['owner_id'] = auth()->id();
        $deal = Deal::create($data);
        return response()->json($deal->load('contact','owner'), 201);
    }

    public function show(Deal $deal)
    {
        return response()->json($deal->load('contact','owner','lead','notes.user','activities.user','files','invoices'));
    }

    public function update(Request $request, Deal $deal)
    {
        $data = $request->validate([
            'title' => 'sometimes|required',
            'stage' => 'nullable|in:Prospecting,Proposal,Negotiation,Closed Won,Closed Lost',
            'value' => 'nullable|numeric', 'expected_close_date' => 'nullable|date',
            'owner_id' => 'nullable|exists:users,id',
        ]);
        $deal->update($data);
        return response()->json($deal->load('contact','owner'));
    }

    public function destroy(Deal $deal)
    {
        $deal->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function pipeline()
    {
        $stages = ['Prospecting','Proposal','Negotiation','Closed Won','Closed Lost'];
        $pipeline = [];
        foreach ($stages as $stage) {
            $pipeline[$stage] = Deal::where('stage', $stage)->with('contact')->get();
        }
        return response()->json($pipeline);
    }
}