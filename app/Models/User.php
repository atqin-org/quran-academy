<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

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
     * The clubs that belong to the user.
     */
    public function clubs()
    {
        return $this->belongsToMany(Club::class, 'club_user', 'user_id', 'club_id');
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
}
