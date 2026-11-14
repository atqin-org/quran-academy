<?php

namespace App\Observers;

use App\Models\ProgramSession;
use App\Services\Notifications\NotificationSyncService;

class ProgramSessionObserver
{
    public function saved(ProgramSession $session): void
    {
        $this->scheduleSync();
    }

    public function deleted(ProgramSession $session): void
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
