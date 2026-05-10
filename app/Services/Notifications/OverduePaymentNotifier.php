<?php

namespace App\Services\Notifications;

use App\Models\Student;
use App\Models\User;
use App\Notifications\Payments\PaymentOverdue;
use App\Notifications\Registry;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class OverduePaymentNotifier extends TargetedNotifier
{
    protected function notificationType(): string
    {
        return Registry::PAYMENT_OVERDUE;
    }

    protected function notifiables(): Collection
    {
        return User::query()
            ->where(function ($q) {
                $q->where('role', 'admin')
                    ->orWhereHas('clubs');
            })
            ->get();
    }

    /**
     * Students with negative session credit AND a non-zero subscription —
     * matches StatisticsController::latePayment definition.
     */
    protected function currentTargets(): array
    {
        $students = Student::query()
            ->where('sessions_credit', '<', 0)
            ->where('subscription', '!=', 0)
            ->with(['club:id,name', 'category:id,name'])
            ->get();

        $targets = [];
        foreach ($students as $student) {
            $key = 'payment_overdue:'.$student->id;
            $targets[$key] = [
                'student_id' => $student->id,
                'student_name' => trim($student->first_name.' '.$student->last_name),
                'club_id' => $student->club_id,
                'club_name' => $student->club?->name,
                'category_name' => $student->category?->name,
                'sessions_credit' => (int) $student->sessions_credit,
                'manage_url' => route('students.payment.show', $student->id, false),
            ];
        }

        return $targets;
    }

    protected function makeNotification(array $context): Notification
    {
        return new PaymentOverdue($context);
    }
}
