<?php
namespace App\Http\Controllers;
use App\Models\Lead;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $leads = Lead::with('contact','assignedTo')
            ->when($request->search, fn($q) => $q->where('title','like',"%{$request->search}%"))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->source, fn($q) => $q->where('source', $request->source))
            ->when($request->assigned_to, fn($q) => $q->where('assigned_to', $request->assigned_to))
            ->latest()->paginate(15);
        return response()->json($leads);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required', 'contact_id' => 'nullable|exists:contacts,id',
            'source' => 'required|in:Website,Ads,Referral,Other',
            'status' => 'nullable|in:New,Contacted,Qualified,Converted',
            'assigned_to' => 'nullable|exists:users,id',
        ]);
        $lead = Lead::create($data);
        return response()->json($lead->load('contact','assignedTo'), 201);
    }

    public function show(Lead $lead)
    {
        return response()->json($lead->load('contact','assignedTo','deal','notes.user','activities.user','files'));
    }

    public function update(Request $request, Lead $lead)
    {
        $data = $request->validate([
            'title' => 'sometimes|required',
            'status' => 'nullable|in:New,Contacted,Qualified,Converted',
            'source' => 'nullable', 'assigned_to' => 'nullable|exists:users,id',
            'contact_id' => 'nullable|exists:contacts,id',
        ]);
        $lead->update($data);
        return response()->json($lead->load('contact','assignedTo'));
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function convert(Lead $lead)
    {
        $lead->update(['status' => 'Converted']);
        $deal = \App\Models\Deal::create([
            'title' => $lead->title,
            'contact_id' => $lead->contact_id,
            'lead_id' => $lead->id,
            'owner_id' => auth()->id(),
        ]);
        return response()->json(['message' => 'Lead converted', 'deal' => $deal]);
    }
}