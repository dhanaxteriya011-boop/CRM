<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deal extends Model
{
    use SoftDeletes;
    protected $fillable = ['title','contact_id','lead_id','stage','value','expected_close_date','owner_id'];

    public function contact() { return $this->belongsTo(Contact::class); }
    public function lead() { return $this->belongsTo(Lead::class); }
    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function notes() { return $this->morphMany(Note::class, 'notable'); }
    public function activities() { return $this->morphMany(Activity::class, 'related'); }
    public function files() { return $this->morphMany(File::class, 'fileable'); }
    public function invoices() { return $this->hasMany(Invoice::class); }
}