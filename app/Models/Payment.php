<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'value',
        'start_at',
        'end_at',
        'id_user',
        'id_student',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'id_student');
    }
}
