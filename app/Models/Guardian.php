<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class Guardian extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name',
        'gender',
        'job',
        'phone',
    ];

    public function students()
    {
        return $this->belongsToMany(Student::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'gender', 'job', 'phone'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function (string $eventName) {
                $events = [
                    'created' => 'تم إنشاء ولي الأمر',
                    'updated' => 'تم تحديث ولي الأمر',
                    'deleted' => 'تم حذف ولي الأمر',
                ];
                return $events[$eventName] ?? "تم {$eventName} ولي الأمر";
            })
            ->useLogName('guardian');
    }

    public static function getActivityLogs()
    {
        return ActivityLog::getLogsByType('guardian');
    }
}
