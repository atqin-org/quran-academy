<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class Payment extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'type',
        'value',
        'status',
        'discount',
        'start_at',
        'end_at',
        'user_id',
        'student_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['type', 'value', 'status', 'discount', 'start_at', 'end_at', 'user_id', 'student_id'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function (string $eventName) {
                $events = [
                    'created' => 'تم إنشاء الدفعة',
                    'updated' => 'تم تحديث الدفعة',
                    'deleted' => 'تم حذف الدفعة',
                ];
                return $events[$eventName] ?? "تم {$eventName} الدفعة";
            })
            ->useLogName('payment');
    }

    public static function getActivityLogs()
    {
        return ActivityLog::getLogsByType('payment');
    }
}
