<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    use HasFactory, LogsActivity, Notifiable, SoftDeletes;

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
        'status',
        'must_change_password',
        'invited_at',
        'password_set_at',
        'avatar_style',
        'avatar_color',
        'avatar_variant',
        'hashvatar_mode',
        'hashvatar_animated',
        'hashvatar_tones',
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
        'must_change_password' => 'boolean',
        'invited_at' => 'datetime',
        'password_set_at' => 'datetime',
        'hashvatar_animated' => 'boolean',
    ];

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(PersonnelInvitation::class);
    }

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

    public function notificationPreferences(): HasMany
    {
        return $this->hasMany(NotificationPreference::class);
    }

    /**
     * Return the preference row for the given notification type, or an
     * unsaved default (in_app=true, push=false, email=false) when missing.
     */
    public function preferenceFor(string $type): NotificationPreference
    {
        $existing = $this->notificationPreferences()
            ->where('type', $type)
            ->first();

        if ($existing) {
            return $existing;
        }

        return new NotificationPreference([
            'user_id' => $this->id,
            'type' => $type,
            'in_app' => true,
            'push' => false,
            'email' => false,
        ]);
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
