<?php

namespace App\Observers;

use App\Models\Group;
use App\Services\Notifications\NotificationSyncService;

class GroupObserver
{
    public function saved(Group $group): void
    {
        $this->scheduleSync();
    }

    public function deleted(Group $group): void
    {
        $this->scheduleSync();
    }

    public function restored(Group $group): void
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
