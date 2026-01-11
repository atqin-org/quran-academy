<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DashboardLayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'widgets',
    ];

    protected $casts = [
        'widgets' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the default widget layout configuration.
     */
    public static function getDefaultWidgets(): array
    {
        return [
            [
                'id' => 'financial-total',
                'type' => 'financial_total',
                'position' => ['x' => 0, 'y' => 0],
                'size' => ['w' => 1, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'revenue-by-type',
                'type' => 'revenue_by_type',
                'position' => ['x' => 1, 'y' => 0],
                'size' => ['w' => 1, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'attendance-rate',
                'type' => 'attendance_rate',
                'position' => ['x' => 2, 'y' => 0],
                'size' => ['w' => 1, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'student-count',
                'type' => 'student_count',
                'position' => ['x' => 3, 'y' => 0],
                'size' => ['w' => 1, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'revenue-by-club',
                'type' => 'revenue_by_club',
                'position' => ['x' => 0, 'y' => 1],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'attendance-chart',
                'type' => 'attendance_chart',
                'position' => ['x' => 2, 'y' => 1],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'students-by-club',
                'type' => 'students_by_club',
                'position' => ['x' => 0, 'y' => 2],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'progress-overview',
                'type' => 'progress_overview',
                'position' => ['x' => 2, 'y' => 2],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'most-absent',
                'type' => 'most_absent',
                'position' => ['x' => 0, 'y' => 3],
                'size' => ['w' => 2, 'h' => 2],
                'visible' => true,
            ],
            [
                'id' => 'top-performers',
                'type' => 'top_performers',
                'position' => ['x' => 2, 'y' => 3],
                'size' => ['w' => 2, 'h' => 2],
                'visible' => true,
            ],
            [
                'id' => 'personnel-by-role',
                'type' => 'personnel_by_role',
                'position' => ['x' => 0, 'y' => 5],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'negative-credit',
                'type' => 'negative_credit',
                'position' => ['x' => 2, 'y' => 5],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'students-by-category',
                'type' => 'students_by_category',
                'position' => ['x' => 0, 'y' => 6],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'students-by-club-category',
                'type' => 'students_by_club_category',
                'position' => ['x' => 2, 'y' => 6],
                'size' => ['w' => 2, 'h' => 1],
                'visible' => true,
            ],
            [
                'id' => 'category-breakdown',
                'type' => 'category_breakdown',
                'position' => ['x' => 0, 'y' => 7],
                'size' => ['w' => 4, 'h' => 1],
                'visible' => true,
            ],
        ];
    }
}
