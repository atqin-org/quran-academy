<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Thoman extends Model
{
    use HasFactory;

    protected $table = 'athman';

    protected $fillable = [
        'hizb_id',
        'number',
        'start',
    ];

    protected function casts(): array
    {
        return [
            'hizb_id' => 'integer',
            'number' => 'integer',
        ];
    }

    /**
     * العلاقة: الثمن يتبع حزب واحد
     */
    public function hizb()
    {
        return $this->belongsTo(Hizb::class, 'hizb_id');
    }

    /**
     * العلاقة: الحضور المرتبط بالثمن
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'thoman_id');
    }
}
