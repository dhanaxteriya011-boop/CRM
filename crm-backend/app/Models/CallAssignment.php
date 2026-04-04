<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallAssignment extends Model
{
    protected $fillable = [
        'call_queue_id','user_id','attempt_number',
        'status','assigned_at','responded_at','timeout_at','miss_reason',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'responded_at' => 'datetime',
        'timeout_at' => 'datetime',
    ];

    public function callQueue() { return $this->belongsTo(CallQueue::class); }
    public function user() { return $this->belongsTo(User::class); }
}