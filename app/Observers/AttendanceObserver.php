<?php

namespace App\Observers;

use App\Models\Attendance;
use App\Services\Notifications\NotificationSyncService;

class AttendanceObserver
{
    public function saved(Attendance $attendance): void
    {
        $this->scheduleSync();
    }

    public function deleted(Attendance $attendance): void
    {
        $this->scheduleSync();
    }

    private function scheduleSync(): void
    {
        dispatch(function () {
            app(NotificationSyncService::class)->all();
        })->afterResponse();
    }
}
