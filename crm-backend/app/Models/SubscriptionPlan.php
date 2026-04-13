<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = ['name', 'price', 'max_members', 'features', 'active'];
    protected $casts = ['features' => 'array', 'active' => 'boolean'];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'plan_id');
    }

    public function isUnlimited(): bool
    {
        return $this->max_members === -1;
    }
}