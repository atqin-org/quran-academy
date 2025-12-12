<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Models\Activity;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, LogsActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'last_name',
        'phone',
        'role',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    /**
     * The clubs that associated with the user.
     */
    public function clubs()
    {
        return $this->belongsToMany(Club::class);
    }

    /**
     * Get all accessible clubs for the user.
     */
    public function accessibleClubs()
    {
        if ($this->role === 'admin') {
            return Club::all();
        }

        return $this->clubs;
    }

    /**
     * Get all accessible categories for the user.
     */
    public function accessibleCategories()
    {
        if ($this->role === 'admin') {
            return Category::all();
        }

        return Category::all();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'last_name', 'phone', 'role', 'email'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function (string $eventName) {
                $events = [
                    'created' => 'تم إنشاء المستخدم',
                    'updated' => 'تم تحديث المستخدم',
                    'deleted' => 'تم حذف المستخدم',
                ];
                return $events[$eventName] ?? "تم {$eventName} المستخدم";
            })
            ->useLogName('user');
    }

    public function getLogs()
    {
        return $this->activities()->orderBy('created_at', 'desc')->get();
    }
    public static function getActivityLogs()
    {
        return ActivityLog::getLogsByType('user');
    }
}
