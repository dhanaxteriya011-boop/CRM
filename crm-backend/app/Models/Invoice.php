<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = ['invoice_number','contact_id','deal_id','amount','status','due_date','notes'];

    public function contact() { return $this->belongsTo(Contact::class); }
    public function deal() { return $this->belongsTo(Deal::class); }
}