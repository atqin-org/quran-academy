<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = ['session_id', 'student_id', 'status', 'hizb_id', 'thoman_id', 'excusedReason'];

    public function session()
    {
        return $this->belongsTo(ProgramSession::class, 'session_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }


    public function hizb()
    {
        return $this->belongsTo(Hizb::class, 'hizb_id');
    }

    public function thoman()
    {
        return $this->belongsTo(Thoman::class, 'thoman_id');
    }
}
