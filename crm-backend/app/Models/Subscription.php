<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'admin_id', 'plan_id', 'status',
        'started_at', 'expires_at', 'amount_paid',
        'payment_reference', 'payment_method', 'notes',
    ];

    protected $casts = [
        'started_at' => 'date',
        'expires_at' => 'date',
    ];

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && $this->expires_at->isFuture();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function daysLeft(): int
    {
        return max(0, now()->diffInDays($this->expires_at, false));
    }
}