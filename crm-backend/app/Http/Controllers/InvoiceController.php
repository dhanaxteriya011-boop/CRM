<?php
namespace App\Http\Controllers;
use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Invoice::with('contact','deal')
            ->when($request->status, fn($q) => $q->where('status',$request->status))
            ->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'contact_id' => 'required|exists:contacts,id',
            'deal_id' => 'nullable|exists:deals,id',
            'amount' => 'required|numeric',
            'due_date' => 'nullable|date',
            'notes' => 'nullable',
        ]);
        $data['invoice_number'] = 'INV-' . strtoupper(uniqid());
        return response()->json(Invoice::create($data)->load('contact','deal'), 201);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $invoice->update($request->validate([
            'amount' => 'sometimes|numeric',
            'status' => 'nullable|in:Unpaid,Paid,Cancelled',
            'due_date' => 'nullable|date',
            'notes' => 'nullable',
        ]));
        return response()->json($invoice);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'Deleted']);
    }
}