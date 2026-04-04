<?php
namespace App\Http\Controllers;
use App\Models\{Contact, Lead, Deal, Activity};
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function global(Request $request)
    {
        $q = $request->get('q', '');
        if (strlen($q) < 2) return response()->json([]);

        $contacts = Contact::where('name','like',"%$q%")->orWhere('email','like',"%$q%")->limit(5)->get()->map(fn($c) => [...$c->toArray(), 'type' => 'Contact']);
        $leads = Lead::where('title','like',"%$q%")->limit(5)->get()->map(fn($l) => [...$l->toArray(), 'type' => 'Lead']);
        $deals = Deal::where('title','like',"%$q%")->limit(5)->get()->map(fn($d) => [...$d->toArray(), 'type' => 'Deal']);

        return response()->json([...$contacts, ...$leads, ...$deals]);
    }
}