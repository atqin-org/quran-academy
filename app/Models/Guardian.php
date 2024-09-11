<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Guardian extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'gender',
        'job',
        'phone',
    ];

    public function students()
    {
        return $this->belongsToMany(Student::class);
    }

}
