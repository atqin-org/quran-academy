<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClubCategorySession extends Model
{
    use HasFactory;

    protected $table = 'club_category_sessions';

    protected $fillable = [
        'club_id',
        'category_id',
        'sessions_per_month',
    ];

    protected $casts = [
        'sessions_per_month' => 'integer',
    ];

    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get sessions per month for a club/category combination
     * Returns default (12) if no config exists
     */
    public static function getSessionsPerMonth(int $clubId, int $categoryId): int
    {
        $config = self::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->first();

        return $config?->sessions_per_month ?? 12;
    }
}
