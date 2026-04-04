<?php
namespace App\Http\Controllers;
use App\Models\Contact;
use App\Imports\ContactsImport;
use App\Exports\ContactsExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $contacts = Contact::with('owner')
            ->when($request->search, fn($q) => $q->where('name','like',"%{$request->search}%")->orWhere('email','like',"%{$request->search}%"))
            ->when($request->tag, fn($q) => $q->where('tag', $request->tag))
            ->when($request->owner_id, fn($q) => $q->where('owner_id', $request->owner_id))
            ->latest()->paginate(15);
        return response()->json($contacts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required', 'email' => 'nullable|email|unique:contacts',
            'phone' => 'nullable', 'company' => 'nullable',
            'address' => 'nullable', 'tag' => 'nullable|in:Hot lead,Cold lead,Warm lead,Customer',
        ]);
        $data['owner_id'] = auth()->id();
        $contact = Contact::create($data);
        return response()->json($contact->load('owner'), 201);
    }

    public function show(Contact $contact)
    {
        return response()->json($contact->load('owner','leads','deals','notes.user','activities.user','files','emails'));
    }

    public function update(Request $request, Contact $contact)
    {
        $data = $request->validate([
            'name' => 'sometimes|required', 'email' => "nullable|email|unique:contacts,email,{$contact->id}",
            'phone' => 'nullable', 'company' => 'nullable',
            'address' => 'nullable', 'tag' => 'nullable', 'owner_id' => 'nullable|exists:users,id',
        ]);
        $contact->update($data);
        return response()->json($contact->load('owner'));
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function import(Request $request)
    {
        $request->validate(['file' => 'required|mimes:csv,xlsx']);
        Excel::import(new ContactsImport, $request->file('file'));
        return response()->json(['message' => 'Imported successfully']);
    }

    public function export()
    {
        return Excel::download(new ContactsExport, 'contacts.xlsx');
    }
}