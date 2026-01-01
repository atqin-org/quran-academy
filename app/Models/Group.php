<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Group extends Model
{
    /** @use HasFactory<\Database\Factories\GroupFactory> */
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * Arabic Abjad sequence for auto-naming groups
     */
    public const ARABIC_ABJAD = [
        'أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح', 'ط', 'ي',
        'ك', 'ل', 'م', 'ن', 'س', 'ع', 'ف', 'ص', 'ق', 'ر',
        'ش', 'ت', 'ث', 'خ', 'ذ', 'ض', 'ظ', 'غ',
    ];

    protected $fillable = [
        'club_id',
        'category_id',
        'name',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'order' => 'integer',
    ];

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function programs(): HasMany
    {
        return $this->hasMany(Program::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get the next available Arabic letter name for a club+category combination
     * Reuses deleted letters (e.g., if B was deleted, new group can be named B)
     */
    public static function getNextName(int $clubId, int $categoryId): string
    {
        // Only check active (non-deleted) groups so deleted letters can be reused
        $existingNames = self::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->pluck('name')
            ->toArray();

        foreach (self::ARABIC_ABJAD as $letter) {
            if (! in_array($letter, $existingNames)) {
                return $letter;
            }
        }

        // Fallback if all letters are used
        return 'فوج '.(count($existingNames) + 1);
    }

    /**
     * Get the next order number for a club+category combination
     */
    public static function getNextOrder(int $clubId, int $categoryId): int
    {
        return self::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->max('order') + 1;
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'club_id', 'category_id', 'is_active'])
            ->logOnlyDirty()
            ->setDescriptionForEvent(function (string $eventName) {
                $events = [
                    'created' => 'تم إنشاء الفوج',
                    'updated' => 'تم تحديث الفوج',
                    'deleted' => 'تم حذف الفوج',
                ];

                return $events[$eventName] ?? "تم {$eventName} الفوج";
            })
            ->useLogName('group');
    }
}
