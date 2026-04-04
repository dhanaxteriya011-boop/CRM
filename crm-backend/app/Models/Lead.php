<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use SoftDeletes;
    protected $fillable = ['title','contact_id','source','status','assigned_to','notes'];

    public function contact() { return $this->belongsTo(Contact::class); }
    public function assignedTo() { return $this->belongsTo(User::class, 'assigned_to'); }
    public function deal() { return $this->hasOne(Deal::class); }
    public function notes() { return $this->morphMany(Note::class, 'notable'); }
    public function activities() { return $this->morphMany(Activity::class, 'related'); }
    public function files() { return $this->morphMany(File::class, 'fileable'); }
}