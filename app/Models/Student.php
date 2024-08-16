<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    // Define the fillable properties
    protected $fillable = [
        'id_club',
        'first_name',
        'last_name',
        'gender',
        'birthdate',
        'social_status',
        'has_cronic_disease',
        'cronic_disease',
        'family_status',
        'father_job',
        'mother_job',
        'father_phone',
        'mother_phone',
        'id_category',
        'subscription_expire_at',
        'insurance_expire_at',
        'picture',
        'file',
    ];

    protected $casts = [
        'birthdate' => 'date',
        'subscription_expire_at' => 'date',
        'insurance_expire_at' => 'date',
        'picture' => 'string',
        'file' => 'string',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class, 'id_club');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'id_category');
    }
}
