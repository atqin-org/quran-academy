<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'gender',
        'description',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = ['display_name'];

    /**
     * Cache for duplicate category names.
     */
    private static ?array $duplicateNamesCache = null;

    public function students()
    {
        return $this->hasMany(Student::class, 'category_id');
    }

    public function groups()
    {
        return $this->hasMany(Group::class, 'category_id');
    }

    /**
     * Get category names that have duplicates (same name, different gender).
     */
    public static function getDuplicateNames(): array
    {
        if (self::$duplicateNamesCache === null) {
            self::$duplicateNamesCache = self::query()
                ->select('name')
                ->groupBy('name')
                ->havingRaw('COUNT(*) > 1')
                ->pluck('name')
                ->toArray();
        }

        return self::$duplicateNamesCache;
    }

    /**
     * Clear the duplicate names cache.
     */
    public static function clearDuplicateNamesCache(): void
    {
        self::$duplicateNamesCache = null;
    }

    /**
     * Get the display name attribute (accessor for $appends).
     */
    public function getDisplayNameAttribute(): string
    {
        $duplicateNames = self::getDuplicateNames();

        if (in_array($this->name, $duplicateNames)) {
            $genderLabel = $this->gender === 'male' ? 'ذكور' : 'إناث';

            return $this->name.' ('.$genderLabel.')';
        }

        return $this->name;
    }

    /**
     * Static helper to format a category name with gender if needed.
     */
    public static function formatName(string $name, ?string $gender): string
    {
        if ($gender === null) {
            return $name;
        }

        $duplicateNames = self::getDuplicateNames();

        if (in_array($name, $duplicateNames)) {
            $genderLabel = $gender === 'male' ? 'ذكور' : 'إناث';

            return $name.' ('.$genderLabel.')';
        }

        return $name;
    }
}
