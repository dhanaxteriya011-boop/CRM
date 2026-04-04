<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SentEmail extends Model
{
    protected $fillable = ['user_id','to_email','subject','body','opened','opened_at','related_id','related_type'];
    protected $casts = ['opened' => 'boolean', 'opened_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function related() { return $this->morphTo(); }
}