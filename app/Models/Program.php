<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subject_id',
        'club_id',
        'category_id',
        'section_id',
        'start_date',
        'end_date',
        'days_of_week'
    ];

    protected $casts = [
        'days_of_week' => 'array',
        'start_date' => 'date:d/m/Y',
        'end_date' => 'date:d/m/Y',
        'created_at' => 'datetime:d/m/Y H:i',
        'updated_at' => 'datetime:d/m/Y H:i',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function sessions()
    {
        return $this->hasMany(ProgramSession::class);
    }
}
