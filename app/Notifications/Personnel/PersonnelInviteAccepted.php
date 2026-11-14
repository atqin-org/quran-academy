<?php

namespace App\Notifications\Personnel;

use App\Notifications\Registry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PersonnelInviteAccepted extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(public array $context) {}

    public function databaseType(object $notifiable): string
    {
        return Registry::PERSONNEL_INVITE_ACCEPTED;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $pref = $notifiable->preferenceFor(Registry::PERSONNEL_INVITE_ACCEPTED);

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
            ->subject('قَبِل المستخدم الدعوة')
            ->line(($this->context['personnel_name'] ?? '').' قام بتفعيل حسابه.')
            ->action('عرض الموظفين', url(route('personnels.index')));
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return array_merge($this->context, [
            'target_key' => 'personnel_invite_accepted:'.($this->context['personnel_id'] ?? ''),
        ]);
    }
}
