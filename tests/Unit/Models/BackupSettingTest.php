<?php

use App\Models\BackupSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('returns the default when no row exists', function () {
    expect(BackupSetting::get('missing_key', 'fallback'))->toBe('fallback');
    expect(BackupSetting::get('missing_key'))->toBeNull();
});

it('round-trips values through JSON cast', function (string $key, mixed $value) {
    BackupSetting::set($key, $value);
    expect(BackupSetting::get($key))->toBe($value);
})->with([
    'boolean true' => ['schedule_enabled', true],
    'boolean false' => ['schedule_enabled', false],
    'integer' => ['max_backups', 25],
    'zero' => ['schedule_minute', 0],
    'string' => ['schedule_frequency', 'weekly'],
]);

it('set is idempotent and updates the existing row', function () {
    BackupSetting::set('schedule_hour', 2);
    BackupSetting::set('schedule_hour', 5);

    expect(BackupSetting::get('schedule_hour'))->toBe(5);
    expect(BackupSetting::query()->where('key', 'schedule_hour')->count())->toBe(1);
});
