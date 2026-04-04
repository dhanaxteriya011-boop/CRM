<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use SoftDeletes;
    protected $fillable = ['name','email','phone','company','address','tag','owner_id'];

    public function owner() { return $this->belongsTo(User::class, 'owner_id'); }
    public function leads() { return $this->hasMany(Lead::class); }
    public function deals() { return $this->hasMany(Deal::class); }
    public function notes() { return $this->morphMany(Note::class, 'notable'); }
    public function activities() { return $this->morphMany(Activity::class, 'related'); }
    public function files() { return $this->morphMany(File::class, 'fileable'); }
    public function emails() { return $this->morphMany(SentEmail::class, 'related'); }
}