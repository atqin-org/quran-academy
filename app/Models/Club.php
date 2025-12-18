<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'location',
    ];

    public function students()
    {
        return $this->hasMany(Student::class, 'club_id');
    }

    public function users()
    {
        return $this->belongsToMany(User::class);
    }

    public function categorySessionConfigs()
    {
        return $this->hasMany(ClubCategorySession::class, 'club_id');
    }

    public function groups()
    {
        return $this->hasMany(Group::class, 'club_id');
    }

    /**
     * Get sessions per month for a specific category in this club
     */
    public function getSessionsPerMonthForCategory(int $categoryId): int
    {
        return ClubCategorySession::getSessionsPerMonth($this->id, $categoryId);
    }
}
