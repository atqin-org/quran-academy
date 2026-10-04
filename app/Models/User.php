<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class User extends Authenticatable
{
    use HasFactory, LogsActivity, Notifiable, SoftDeletes;

    /**
     * @var Collection<int, array<int, int>|null>|null
     */
    protected ?Collection $accessMapCache = null;

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

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * The clubs that associated with the user.
     */
    public function clubs(): BelongsToMany
    {
        return $this->belongsToMany(Club::class);
    }

    /**
     * Categories the user is restricted to inside a club (pivot `club_id`).
     * A club with no rows here grants access to every category in it.
     */
    public function categoryRestrictions(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'category_club_user')
            ->withPivot('club_id')
            ->withTimestamps();
    }

    /**
     * Get all accessible clubs for the user.
     */
    public function accessibleClubs(): EloquentCollection
    {
        if ($this->isAdmin()) {
            return Club::all();
        }

        return $this->clubs;
    }

    /**
     * Get the categories the user may access, optionally inside a single club.
     */
    public function accessibleCategories(?int $clubId = null): EloquentCollection
    {
        if ($this->isAdmin()) {
            return Category::all();
        }

        $map = $clubId === null ? $this->accessMap() : $this->accessMap()->only([$clubId]);

        if ($map->isEmpty()) {
            return new EloquentCollection;
        }

        if ($map->contains(fn (?array $categoryIds) => $categoryIds === null)) {
            return Category::all();
        }

        return Category::whereIn('id', $map->flatten()->unique()->all())->get();
    }

    /**
     * Club id → allowed category ids. `null` means every category of that club.
     *
     * @return Collection<int, array<int, int>|null>
     */
    public function accessMap(): Collection
    {
        if ($this->accessMapCache !== null) {
            return $this->accessMapCache;
        }

        $restrictions = $this->categoryRestrictions()
            ->get(['categories.id'])
            ->groupBy(fn (Category $category) => (int) $category->pivot->club_id)
            ->map(fn ($categories) => $categories->pluck('id')->map(fn ($id) => (int) $id)->values()->all());

        return $this->accessMapCache = $this->clubs()
            ->pluck('clubs.id')
            ->mapWithKeys(fn ($clubId) => [(int) $clubId => $restrictions->get((int) $clubId)]);
    }

    /**
     * The access map as sent to the frontend; admins get every club unrestricted.
     *
     * @return array<int, array<int, int>|null>
     */
    public function accessMapForFrontend(): array
    {
        if ($this->isAdmin()) {
            return Club::pluck('id')->mapWithKeys(fn ($id) => [(int) $id => null])->all();
        }

        return $this->accessMap()->all();
    }

    public function flushAccessMap(): void
    {
        $this->accessMapCache = null;
    }

    public function canAccess(?int $clubId, ?int $categoryId = null): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        if ($clubId === null || ! $this->accessMap()->has($clubId)) {
            return false;
        }

        $allowedCategoryIds = $this->accessMap()->get($clubId);

        return $allowedCategoryIds === null
            || $categoryId === null
            || in_array($categoryId, $allowedCategoryIds, true);
    }

    /**
     * Restrict a query over rows carrying club / category columns to what the user may access.
     */
    public function constrainQuery(
        Builder|QueryBuilder|Relation $query,
        string $clubColumn = 'club_id',
        string $categoryColumn = 'category_id'
    ): Builder|QueryBuilder|Relation {
        if ($this->isAdmin()) {
            return $query;
        }

        $map = $this->accessMap();

        if ($map->isEmpty()) {
            return $query->whereRaw('1 = 0');
        }

        $unrestrictedClubIds = $map->filter(fn (?array $categoryIds) => $categoryIds === null)->keys()->all();
        $restricted = $map->reject(fn (?array $categoryIds) => $categoryIds === null);

        return $query->where(function ($inner) use ($unrestrictedClubIds, $restricted, $clubColumn, $categoryColumn) {
            if ($unrestrictedClubIds !== []) {
                $inner->orWhereIn($clubColumn, $unrestrictedClubIds);
            }

            foreach ($restricted as $clubId => $categoryIds) {
                $inner->orWhere(fn ($pair) => $pair->where($clubColumn, $clubId)->whereIn($categoryColumn, $categoryIds));
            }
        });
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
