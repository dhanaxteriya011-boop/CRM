<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, HasRoles, Notifiable;
    protected $fillable = ['name', 'email', 'password', 'is_active'];
    protected $hidden = ['password', 'remember_token'];
    protected $casts = ['email_verified_at' => 'datetime'];

    public function contacts() { return $this->hasMany(Contact::class, 'owner_id'); }
    public function leads() { return $this->hasMany(Lead::class, 'assigned_to'); }
    public function deals() { return $this->hasMany(Deal::class, 'owner_id'); }
    public function activities() { return $this->hasMany(Activity::class); }
    public function teams() { return $this->belongsToMany(Team::class); }
}