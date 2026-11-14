<?php

namespace App\Services\Notifications;

use App\Services\CapacityNotifier;

class NotificationSyncService
{
    public function __construct(
        private CapacityNotifier $capacity,
        private PendingAttendanceNotifier $pendingAttendance,
        private OverduePaymentNotifier $overduePayment,
    ) {}

    /**
     * Run every targeted notifier and aggregate the results.
     *
     * @return array<string, array{sent: int, resolved: int}>
     */
    public function all(): array
    {
        return [
            'capacity' => $this->capacity->sync(),
            'pending_attendance' => $this->pendingAttendance->sync(),
            'overdue_payment' => $this->overduePayment->sync(),
        ];
    }
}
