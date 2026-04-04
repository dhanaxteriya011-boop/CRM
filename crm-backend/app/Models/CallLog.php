<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallLog extends Model
{
    protected $fillable = [
        'call_queue_id','user_id','started_at','ended_at',
        'duration_seconds','outcome','notes','next_action',
        'create_followup','followup_at','followup_type',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'create_followup' => 'boolean',
        'followup_at' => 'datetime',
    ];

    public function callQueue() { return $this->belongsTo(CallQueue::class); }
    public function user() { return $this->belongsTo(User::class); }
}