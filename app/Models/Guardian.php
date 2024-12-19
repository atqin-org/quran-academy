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
            ->setDescriptionForEvent(fn(string $eventName) => "Guardian has been {$eventName}")
            ->useLogName('guardian');
    }

    public static function getActivityLogs()
    {
        return ActivityLog::getLogsByType('guardian');
    }
}
