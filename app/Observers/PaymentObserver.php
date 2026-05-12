<?php

namespace App\Observers;

use App\Models\Payment;
use App\Services\Notifications\NotificationSyncService;

class PaymentObserver
{
    public function saved(Payment $payment): void
    {
        $this->scheduleSync();
    }

    public function deleted(Payment $payment): void
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
