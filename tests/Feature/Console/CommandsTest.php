<?php

use App\Jobs\ProcessScheduledBackup;
use App\Models\BackupSetting;
use App\Services\CapacityNotifier;
use App\Services\Notifications\NotificationSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Bus;

uses(RefreshDatabase::class);

it('capacity:scan invokes CapacityNotifier::sync', function () {
    $this->mock(CapacityNotifier::class)
        ->shouldReceive('sync')
        ->once()
        ->andReturn(['sent' => 0, 'resolved' => 0]);

    $exit = Artisan::call('capacity:scan');

    expect($exit)->toBe(0);
});

it('notifications:scan invokes NotificationSyncService::all', function () {
    $this->mock(NotificationSyncService::class)
        ->shouldReceive('all')
        ->once()
        ->andReturn([
            'capacity' => ['sent' => 0, 'resolved' => 0],
        ]);

    $exit = Artisan::call('notifications:scan');

    expect($exit)->toBe(0);
});

it('backup:test-scheduled with --force dispatches the job even when disabled', function () {
    Bus::fake();
    BackupSetting::set('schedule_enabled', false);

    $exit = Artisan::call('backup:test-scheduled', ['--force' => true]);

    expect($exit)->toBe(0);
    Bus::assertDispatched(ProcessScheduledBackup::class);
});

it('backup:test-scheduled does not dispatch when disabled and not forced', function () {
    Bus::fake();
    BackupSetting::set('schedule_enabled', false);

    $exit = Artisan::call('backup:test-scheduled');

    expect($exit)->toBe(1);
    Bus::assertNotDispatched(ProcessScheduledBackup::class);
});

it('backup:test-scheduled dispatches when schedule is enabled', function () {
    Bus::fake();
    BackupSetting::set('schedule_enabled', true);

    $exit = Artisan::call('backup:test-scheduled');

    expect($exit)->toBe(0);
    Bus::assertDispatched(ProcessScheduledBackup::class);
});
