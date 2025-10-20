<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hizb extends Model
{
    use HasFactory;

    protected $table = 'ahzab';

    protected $fillable = [
        'number',
        'start',
    ];

    /**
     * العلاقة: الحزب له عدة أثمان
     */
    public function athman()
    {
        return $this->hasMany(Thoman::class, 'hizb_id');
    }

    /**
     * العلاقة: الحضور المرتبط بالحزب
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'hizb_id');
    }
}
