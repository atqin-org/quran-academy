<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RepetitionThumn extends Model
{
    use HasFactory;

    protected $fillable = [
        'repetition_id',
        'thoman_id',
        'result',
        'mistakes_count',
        'note',
    ];

    protected $casts = [
        'mistakes_count' => 'integer',
    ];

    public function repetition()
    {
        return $this->belongsTo(Repetition::class, 'repetition_id');
    }

    public function thoman()
    {
        return $this->belongsTo(Thoman::class, 'thoman_id');
    }
}
