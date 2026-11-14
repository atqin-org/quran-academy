<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonnelInviteSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
    ];

    protected $casts = [
        'value' => 'json',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key', $key)->first();

        return $setting ? $setting->value : $default;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
    }

    public static function deliveryChannel(): string
    {
        $value = static::get('delivery_channel', 'both');

        return in_array($value, ['email', 'link', 'both'], true) ? $value : 'both';
    }
}
