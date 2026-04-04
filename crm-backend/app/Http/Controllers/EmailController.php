<?php
namespace App\Http\Controllers;
use App\Models\EmailTemplate;
use App\Models\SentEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailController extends Controller
{
    public function templates(Request $request)
    {
        return response()->json(EmailTemplate::with('creator')->paginate(15));
    }

    public function createTemplate(Request $request)
    {
        $data = $request->validate(['name' => 'required', 'subject' => 'required', 'body' => 'required']);
        $data['created_by'] = auth()->id();
        return response()->json(EmailTemplate::create($data), 201);
    }

    public function updateTemplate(Request $request, EmailTemplate $template)
    {
        $template->update($request->validate(['name' => 'required', 'subject' => 'required', 'body' => 'required']));
        return response()->json($template);
    }

    public function deleteTemplate(EmailTemplate $template)
    {
        $template->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function send(Request $request)
    {
        $data = $request->validate([
            'to_email' => 'required|email', 'subject' => 'required', 'body' => 'required',
            'related_id' => 'nullable|integer', 'related_type' => 'nullable|string',
        ]);
        Mail::html($data['body'], function($msg) use ($data) {
            $msg->to($data['to_email'])->subject($data['subject']);
        });
        $trackingId = uniqid('track_');
        $sent = SentEmail::create([...$data, 'user_id' => auth()->id()]);
        return response()->json($sent, 201);
    }

    public function sentList(Request $request)
    {
        $emails = SentEmail::where('user_id', auth()->id())->latest()->paginate(15);
        return response()->json($emails);
    }

    public function trackOpen($id)
    {
        $email = SentEmail::find($id);
        if ($email && !$email->opened) {
            $email->update(['opened' => true, 'opened_at' => now()]);
        }
        return response('', 204);
    }
}