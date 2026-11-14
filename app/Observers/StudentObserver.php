<?php

namespace App\Observers;

use App\Models\Student;
use App\Services\Notifications\NotificationSyncService;

class StudentObserver
{
    public function saved(Student $student): void
    {
        $this->scheduleSync();
    }

    public function deleted(Student $student): void
    {
        $this->scheduleSync();
    }

    public function restored(Student $student): void
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
