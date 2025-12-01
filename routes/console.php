<?php

use App\Jobs\ProcessScheduledBackup;
use App\Models\BackupSetting;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Scheduled backup - runs every minute and checks if it should execute
Schedule::call(function () {
    $enabled = BackupSetting::get('schedule_enabled', false);
    if (!$enabled) {
        return;
    }

    $frequency = BackupSetting::get('schedule_frequency', 'daily');
    $minute = (int) BackupSetting::get('schedule_minute', 0);
    $hour = (int) BackupSetting::get('schedule_hour', 2);
    $dayOfWeek = (int) BackupSetting::get('schedule_day_of_week', 0); // 0 = Sunday
    $dayOfMonth = (int) BackupSetting::get('schedule_day_of_month', 1);
    $now = now();

    $shouldRun = false;

    switch ($frequency) {
        case 'hourly':
            // Run at specified minute every hour
            $shouldRun = $now->minute === $minute;
            break;
        case 'daily':
            // Run at specified hour:minute every day
            $shouldRun = $now->hour === $hour && $now->minute === $minute;
            break;
        case 'weekly':
            // Run at specified day of week, hour:minute
            $shouldRun = $now->dayOfWeek === $dayOfWeek && $now->hour === $hour && $now->minute === $minute;
            break;
        case 'monthly':
            // Run at specified day of month, hour:minute
            $shouldRun = $now->day === $dayOfMonth && $now->hour === $hour && $now->minute === $minute;
            break;
    }

    if ($shouldRun) {
        ProcessScheduledBackup::dispatch();
    }
})->everyMinute()
  ->name('scheduled-backup')
  ->withoutOverlapping();

// Cleanup old backups using spatie's built-in command
Schedule::command('backup:clean')->daily()->at('03:00');

// Monitor backup health
Schedule::command('backup:monitor')->daily()->at('04:00');
