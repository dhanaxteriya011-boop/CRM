<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallQueue extends Model
{
    protected $fillable = [
        'title','caller_name','caller_phone','contact_id','lead_id',
        'team_id','routing_type','current_attempt','max_attempts','timeout_minutes',
        'assigned_to','assigned_at','timeout_at','status',
        'attended_by','attended_at','completed_at',
        'escalated_to','escalated_at','escalation_reason',
        'priority','notes','source',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'timeout_at' => 'datetime',
        'attended_at' => 'datetime',
        'completed_at' => 'datetime',
        'escalated_at' => 'datetime',
    ];

    public function contact() { return $this->belongsTo(Contact::class); }
    public function lead() { return $this->belongsTo(Lead::class); }
    public function team() { return $this->belongsTo(Team::class); }
    public function assignedTo() { return $this->belongsTo(User::class, 'assigned_to'); }
    public function attendedBy() { return $this->belongsTo(User::class, 'attended_by'); }
    public function escalatedTo() { return $this->belongsTo(User::class, 'escalated_to'); }
    public function assignments() { return $this->hasMany(CallAssignment::class); }
    public function logs() { return $this->hasMany(CallLog::class); }

    public function isTimedOut(): bool
    {
        return $this->status === 'assigned' && $this->timeout_at && now()->isAfter($this->timeout_at);
    }
}