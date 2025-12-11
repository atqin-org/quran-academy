<?php

namespace App\Actions\Attendance;

use App\Models\Hizb;
use App\Models\ProgramSession;
use App\Models\Student;
use Illuminate\Support\Facades\Log;

class RecordAttendanceAction
{
    /**
     * Statuses that should deduct credits
     */
    private const CREDIT_DEDUCTING_STATUSES = ['present'];

    public function execute(
        ProgramSession $session,
        Student $student,
        string $status,
        $hizb_id = null,
        $thoman_id = null,
        $excusedReason = null
    ) {
        try {
            // Get existing attendance to check previous status
            $existingAttendance = $session->attendances()
                ->where('student_id', $student->id)
                ->first();

            $previousStatus = $existingAttendance?->status;

            $attendance = $session->attendances()->updateOrCreate(
                ['student_id' => $student->id],
                [
                    'status'    => $status,
                    'hizb_id'   => $hizb_id,
                    'thoman_id' => $thoman_id,
                    'excusedReason'    => $excusedReason,
                ]
            );

            // Handle credit deduction
            $creditDeducted = $this->handleCreditDeduction($session, $student, $status, $previousStatus);

            // Update student's last hizb for current direction if present and hizb is recorded
            if ($status === 'present' && $hizb_id) {
                $hizb = Hizb::find($hizb_id);
                if ($hizb) {
                    $student->updateLastHizbForCurrentDirection($hizb->number);
                }
            }

            Log::info('Attendance saved/updated', [
                'id' => $attendance->id,
                'student_id' => $student->id,
                'status' => $attendance->status,
                'hizb_id' => $attendance->hizb_id,
                'thoman_id' => $attendance->thoman_id,
                'excusedReason' => $attendance->excusedReason,
                'credit_deducted' => $creditDeducted,
            ]);

            return $attendance;
        } catch (\Throwable $e) {
            Log::error('Failed to record attendance', [
                'session_id' => $session->id,
                'student_id' => $student->id,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle credit deduction based on status change
     */
    private function handleCreditDeduction(
        ProgramSession $session,
        Student $student,
        string $newStatus,
        ?string $previousStatus
    ): bool {
        // Skip if session is optional
        if ($session->is_optional) {
            return false;
        }

        // Determine if we need to deduct or refund
        $wasDeducting = $previousStatus && in_array($previousStatus, self::CREDIT_DEDUCTING_STATUSES);
        $shouldDeduct = in_array($newStatus, self::CREDIT_DEDUCTING_STATUSES);

        if ($shouldDeduct && !$wasDeducting) {
            // New deducting status - deduct credit
            return $student->deductCredit(1);
        } elseif (!$shouldDeduct && $wasDeducting) {
            // Changed from deducting to non-deducting - refund credit
            // Only refund if student doesn't have infinite sessions
            if (!$student->hasInfiniteSessions()) {
                $student->addCredit(1);
                return true;
            }
        }

        // If both are deducting or both are non-deducting, no change needed
        return false;
    }
}
