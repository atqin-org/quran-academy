<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationTypeSetting extends Model
{
    protected $fillable = [
        'type',
        'dismissable',
    ];

    protected $casts = [
        'dismissable' => 'boolean',
    ];
}
