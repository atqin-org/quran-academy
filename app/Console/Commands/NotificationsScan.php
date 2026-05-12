<?php

namespace App\Console\Commands;

use App\Services\Notifications\NotificationSyncService;
use Illuminate\Console\Command;

class NotificationsScan extends Command
{
    protected $signature = 'notifications:scan';

    protected $description = 'Reconcile every targeted notifier (capacity, attendance, payments) against current state.';

    public function handle(NotificationSyncService $service): int
    {
        $results = $service->all();

        foreach ($results as $key => $result) {
            $this->info("[{$key}] sent: {$result['sent']}, resolved: {$result['resolved']}");
        }

        return self::SUCCESS;
    }
}
