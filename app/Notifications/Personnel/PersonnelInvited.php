<?php

namespace App\Notifications\Personnel;

use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PersonnelInvited extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $inviteUrl,
        public CarbonInterface $expiresAt,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('دعوة لتفعيل الحساب')
            ->view('emails.personnel-invite', [
                'notifiable' => $notifiable,
                'url' => $this->inviteUrl,
                'expiresAt' => $this->expiresAt,
                'appName' => config('app.name'),
            ]);
    }
}
