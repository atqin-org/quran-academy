<?php

namespace App\Observers;

use App\Models\ClubCategorySession;
use App\Services\Notifications\NotificationSyncService;

class ClubCategorySessionObserver
{
    public function saved(ClubCategorySession $session): void
    {
        $this->scheduleSync();
    }

    public function deleted(ClubCategorySession $session): void
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
