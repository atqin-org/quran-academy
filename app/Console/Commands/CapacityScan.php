<?php

namespace App\Console\Commands;

use App\Services\CapacityNotifier;
use Illuminate\Console\Command;

class CapacityScan extends Command
{
    protected $signature = 'capacity:scan';

    protected $description = 'Reconcile capacity-overflow notifications against current state.';

    public function handle(CapacityNotifier $notifier): int
    {
        $result = $notifier->sync();

        $this->info("sent: {$result['sent']}, resolved: {$result['resolved']}");

        return self::SUCCESS;
    }
}
