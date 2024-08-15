<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    // Define the fillable properties
    protected $fillable = [
        'club',
        'firstName',
        'lastName',
        'gender',
        'birthDate',
        'socialStatus',
        'hasCronicDisease',
        'cronicDisease',
        'familyStatus',
        'fatherJob',
        'motherJob',
        'fatherPhone',
        'motherPhone',
        'category',
        'subscription',
        'insurance',
        'picture',
        'file',
    ];

    protected $casts = [
        'birthDate' => 'date',
        'insurance' => 'date',
        'picture' => 'string',
        'file' => 'string',
    ];
}
