<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    protected $fillable = ['name','path','mime_type','uploaded_by','fileable_id','fileable_type'];

    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
    public function fileable() { return $this->morphTo(); }
}