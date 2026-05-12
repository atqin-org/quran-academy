<?php

namespace App\Notifications\Capacity;

use App\Notifications\Registry;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ClassOverCapacity extends Notification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $overflow  Shape returned by CapacityMonitor::getOverflows().
     */
    public function __construct(public array $overflow) {}

    /**
     * Override the database `type` column with a stable short string
     * (matches Registry keys) instead of the FQCN.
     */
    public function databaseType(object $notifiable): string
    {
        return Registry::CLASS_OVER_CAPACITY;
    }

    /**
     * Resolve channels based on the user's per-type preference.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $pref = $notifiable->preferenceFor(Registry::CLASS_OVER_CAPACITY);

        if (! $pref->in_app) {
            return [];
        }

        $channels = ['database'];

        if ($pref->email) {
            $channels[] = 'mail';
        }

        // Push channel will be added when the mobile app ships.

        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('تجاوز السعة الاستيعابية')
            ->view('emails.capacity-overflow', [
                'title' => $this->title(),
                'current' => (int) $this->overflow['current'],
                'capacity' => (int) $this->overflow['capacity'],
                'manageUrl' => $this->overflow['manage_url'],
                'appName' => config('app.name'),
            ]);
    }

    /**
     * Database payload — includes target_key for dedup + auto-resolution.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return array_merge($this->overflow, [
            'target_key' => $this->targetKey(),
        ]);
    }

    public function targetKey(): string
    {
        if (($this->overflow['kind'] ?? null) === 'group') {
            return 'group:'.$this->overflow['id'];
        }

        return 'club_category:'.$this->overflow['club_id'].':'.$this->overflow['category_id'];
    }

    private function title(): string
    {
        $club = $this->overflow['club_name'] ?? '';
        $category = $this->overflow['category_name'] ?? '';

        if (($this->overflow['kind'] ?? null) === 'group') {
            $group = $this->overflow['group_name'] ?? '';

            return "{$club} · {$category} · فوج {$group}";
        }

        return "{$club} · {$category}";
    }
}
