<?php

namespace App\Services\Notifications;

use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Throwable;

abstract class TargetedNotifier
{
    /**
     * Database `type` string identifying notifications dispatched by this notifier.
     * Must match a key in App\Notifications\Registry.
     */
    abstract protected function notificationType(): string;

    /**
     * Users that should receive the notification (admins + personnel attached
     * to at least one club).
     *
     * @return Collection<int, User>
     */
    abstract protected function notifiables(): Collection;

    /**
     * Map of `target_key => $context` for everything that's currently in the
     * "active" state for this notification type. Each context should include
     * a `club_id` so that per-user visibility can be resolved.
     *
     * @return array<string, array<string, mixed>>
     */
    abstract protected function currentTargets(): array;

    /**
     * Build a fresh Notification instance for the given target context.
     *
     * @param  array<string, mixed>  $context
     */
    abstract protected function makeNotification(array $context): Notification;

    /**
     * Decide whether the given user should see the given target. Default rule:
     * admins see everything; non-admins see only targets whose `club_id` (and
     * `category_id`, when present) fall inside their club / category access.
     *
     * @param  array<string, mixed>  $context
     */
    protected function targetVisibleTo(User $user, array $context): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $clubId = $context['club_id'] ?? null;
        if ($clubId === null) {
            return false;
        }

        $categoryId = $context['category_id'] ?? null;

        return $user->canAccess((int) $clubId, $categoryId === null ? null : (int) $categoryId);
    }

    /**
     * Reconcile notifications of this type against the current target state.
     *
     * - For each user, compute the per-user visible subset of currentTargets.
     * - Auto-mark-read any unread notification whose target_key is no longer
     *   in that user's visible set (resolved or access removed).
     * - Send a fresh notification for any visible target_key not already in
     *   the user's unread set (dedup).
     * - A failed send (e.g. mail transport error) is logged and skipped so it
     *   cannot abort the remaining users/targets of the pass; the target stays
     *   unsent and is retried on the next sync.
     *
     * @return array{sent: int, resolved: int}
     */
    public function sync(): array
    {
        $type = $this->notificationType();
        $currentTargets = $this->currentTargets();
        $notifiables = $this->notifiables();

        $sent = 0;
        $resolved = 0;

        foreach ($notifiables as $notifiable) {
            $userTargets = array_filter(
                $currentTargets,
                fn (array $ctx) => $this->targetVisibleTo($notifiable, $ctx),
            );

            $unread = $notifiable->unreadNotifications()
                ->where('type', $type)
                ->get();

            $unreadByTarget = [];
            foreach ($unread as $notification) {
                $key = $notification->data['target_key'] ?? null;
                if ($key !== null) {
                    $unreadByTarget[$key] = $notification;
                }
            }

            foreach ($unreadByTarget as $key => $notification) {
                if (! array_key_exists($key, $userTargets)) {
                    $notification->markAsRead();
                    $resolved++;
                }
            }

            foreach ($userTargets as $key => $context) {
                if (! array_key_exists($key, $unreadByTarget)) {
                    try {
                        NotificationFacade::send($notifiable, $this->makeNotification($context));
                        $sent++;
                    } catch (Throwable $exception) {
                        Log::error('Targeted notification send failed', [
                            'type' => $type,
                            'user_id' => $notifiable->id,
                            'target_key' => $key,
                            'exception' => $exception->getMessage(),
                        ]);
                    }
                }
            }
        }

        return ['sent' => $sent, 'resolved' => $resolved];
    }
}
