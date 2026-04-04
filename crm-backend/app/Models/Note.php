<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Note extends Model
{
    protected $fillable = ['body','user_id','notable_id','notable_type'];

    public function user() { return $this->belongsTo(User::class); }
    public function notable() { return $this->morphTo(); }
}