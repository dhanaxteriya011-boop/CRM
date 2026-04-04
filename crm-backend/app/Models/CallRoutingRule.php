<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallRoutingRule extends Model
{
    protected $fillable = [
        'team_id','routing_type','timeout_minutes','max_attempts',
        'escalate_to_manager','active','user_order','last_assigned_index',
    ];

    protected $casts = [
        'user_order' => 'array',
        'escalate_to_manager' => 'boolean',
        'active' => 'boolean',
    ];

    public function team() { return $this->belongsTo(Team::class); }
}