<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class EmailTemplate extends Model
{
    protected $fillable = ['name','subject','body','created_by'];
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}