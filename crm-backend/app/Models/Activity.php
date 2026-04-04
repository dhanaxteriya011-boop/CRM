<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Activity extends Model
{
    protected $fillable = ['type','title','description','due_at','completed','user_id','related_id','related_type'];
    protected $casts = ['due_at' => 'datetime', 'completed' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }
    public function related() { return $this->morphTo(); }
}