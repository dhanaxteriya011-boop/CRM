<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable;
    protected $fillable = ['name', 'email', 'password', 'is_active', 'username', 'created_by_admin'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['email_verified_at' => 'datetime'];

    public function contacts() { return $this->hasMany(Contact::class, 'owner_id'); }
    public function leads() { return $this->hasMany(Lead::class, 'assigned_to'); }
    public function deals() { return $this->hasMany(Deal::class, 'owner_id'); }
    public function activities() { return $this->hasMany(Activity::class); }
    public function teams() { return $this->belongsToMany(Team::class); }
    public function adminSubscription()
    {
        return $this->hasOne(Subscription::class, 'admin_id')->latest();
    }

    public function createdByAdmin()
    {
        return $this->belongsTo(User::class, 'created_by_admin');
    }

    public function managedMembers()
    {
        // Members this admin created
        return $this->hasMany(User::class, 'created_by_admin');
    }

    // Get the admin's active subscription (works for both admin and member)
    public function getActiveSubscription(): ?Subscription
    {
        if ($this->hasRole('Admin')) {
            return $this->adminSubscription()->where('status', 'active')->first();
        }
        // For members, get their admin's subscription
        return $this->createdByAdmin?->adminSubscription()->where('status', 'active')->first();
    }

    public function canAddMoreMembers(): bool
    {
        $sub = $this->getActiveSubscription();
        if (!$sub) return false;

        $plan = $sub->plan;
        if ($plan->isUnlimited()) return true;

        $currentCount = $this->managedMembers()->count();
        return $currentCount < $plan->max_members;
    }
}