<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Repetition extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'student_id',
        'hizb_id',
        'tester_user_id',
        'tester_student_id',
        'overall_rating',
        'remark',
    ];

    public function session()
    {
        return $this->belongsTo(ProgramSession::class, 'session_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function hizb()
    {
        return $this->belongsTo(Hizb::class, 'hizb_id');
    }

    public function testerUser()
    {
        return $this->belongsTo(User::class, 'tester_user_id');
    }

    public function testerStudent()
    {
        return $this->belongsTo(Student::class, 'tester_student_id');
    }

    public function thumns()
    {
        return $this->hasMany(RepetitionThumn::class, 'repetition_id');
    }
}
