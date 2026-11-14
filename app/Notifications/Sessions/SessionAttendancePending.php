<?php

namespace App\Notifications\Sessions;

use App\Notifications\Registry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SessionAttendancePending extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(public array $context) {}

    public function databaseType(object $notifiable): string
    {
        return Registry::SESSION_ATTENDANCE_PENDING;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $pref = $notifiable->preferenceFor(Registry::SESSION_ATTENDANCE_PENDING);

        if (! $pref->in_app) {
            return [];
        }

        $channels = ['database'];

        if ($pref->email) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('حضور غير مسجّل')
            ->view('emails.session-attendance-pending', [
                'programName' => $this->context['program_name'] ?? '',
                'clubName' => $this->context['club_name'] ?? '',
                'categoryName' => $this->context['category_name'] ?? '',
                'sessionDate' => $this->context['session_date'] ?? '',
                'startTime' => $this->context['start_time'] ?? '',
                'manageUrl' => $this->context['manage_url'],
                'appName' => config('app.name'),
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return array_merge($this->context, [
            'target_key' => 'session_attendance:'.$this->context['id'],
        ]);
    }
}
