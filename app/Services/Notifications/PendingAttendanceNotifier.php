<?php

namespace App\Services\Notifications;

use App\Models\ProgramSession;
use App\Models\User;
use App\Notifications\Registry;
use App\Notifications\Sessions\SessionAttendancePending;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class PendingAttendanceNotifier extends TargetedNotifier
{
    protected function notificationType(): string
    {
        return Registry::SESSION_ATTENDANCE_PENDING;
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
     * Sessions whose date is at least one calendar day old, status is not
     * `completed`, and which still have zero attendance rows.
     */
    protected function currentTargets(): array
    {
        $cutoff = now()->subDay()->toDateString();

        $sessions = ProgramSession::query()
            ->whereDate('session_date', '<=', $cutoff)
            ->where('status', '!=', 'completed')
            ->whereDoesntHave('attendances')
            ->with([
                'program:id,name,club_id,category_id',
                'program.club:id,name',
                'program.category:id,name',
            ])
            ->get();

        $targets = [];
        foreach ($sessions as $session) {
            $key = 'session_attendance:'.$session->id;
            $targets[$key] = [
                'id' => $session->id,
                'program_name' => $session->program?->name,
                'club_id' => $session->program?->club_id,
                'club_name' => $session->program?->club?->name,
                'category_name' => $session->program?->category?->name,
                'session_date' => $session->session_date?->toDateString(),
                'start_time' => $session->start_time?->format('H:i'),
                'manage_url' => route('sessions.attendance', $session->id, false),
            ];
        }

        return $targets;
    }

    protected function makeNotification(array $context): Notification
    {
        return new SessionAttendancePending($context);
    }
}
