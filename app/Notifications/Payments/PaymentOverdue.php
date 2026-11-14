<?php

namespace App\Notifications\Payments;

use App\Notifications\Registry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentOverdue extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $context
     */
    public function __construct(public array $context) {}

    public function databaseType(object $notifiable): string
    {
        return Registry::PAYMENT_OVERDUE;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $pref = $notifiable->preferenceFor(Registry::PAYMENT_OVERDUE);

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
            ->subject('دفع متأخر')
            ->view('emails.payment-overdue', [
                'studentName' => $this->context['student_name'] ?? '',
                'clubName' => $this->context['club_name'] ?? '',
                'categoryName' => $this->context['category_name'] ?? '',
                'sessionsCredit' => $this->context['sessions_credit'] ?? 0,
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
            'target_key' => 'payment_overdue:'.$this->context['student_id'],
        ]);
    }
}
