<?php

use App\Models\User;
use App\Notifications\Registry;
use App\Services\Notifications\TargetedNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

function makeFailingNotifier(int $failForUserId): TargetedNotifier
{
    $notification = new class($failForUserId) extends Notification
    {
        public function __construct(private int $failForUserId) {}

        /**
         * @return array<int, string>
         */
        public function via(object $notifiable): array
        {
            if ($notifiable->id === $this->failForUserId) {
                throw new RuntimeException('mail transport down');
            }

            return ['database'];
        }

        /**
         * @return array<string, mixed>
         */
        public function toArray(object $notifiable): array
        {
            return ['target_key' => 'target-1'];
        }
    };

    return new class($notification) extends TargetedNotifier
    {
        public function __construct(private Notification $notification) {}

        protected function notificationType(): string
        {
            return Registry::SESSION_ATTENDANCE_PENDING;
        }

        protected function notifiables(): Collection
        {
            return User::query()->where('role', 'admin')->orderBy('id')->get();
        }

        protected function currentTargets(): array
        {
            return ['target-1' => ['club_id' => null]];
        }

        protected function makeNotification(array $context): Notification
        {
            return $this->notification;
        }
    };
}

it('continues the pass when one send fails, logging the error', function () {
    Log::spy();
    $failingAdmin = User::factory()->create(['role' => 'admin']);
    $healthyAdmin = User::factory()->create(['role' => 'admin']);

    $result = makeFailingNotifier($failingAdmin->id)->sync();

    expect($result['sent'])->toBe(1)
        ->and($failingAdmin->fresh()->notifications()->count())->toBe(0)
        ->and($healthyAdmin->fresh()->unreadNotifications()->count())->toBe(1);

    Log::shouldHaveReceived('error')->once();
});

it('retries a failed send on the next sync', function () {
    Log::spy();
    $failingAdmin = User::factory()->create(['role' => 'admin']);

    $notifier = makeFailingNotifier($failingAdmin->id);
    $notifier->sync();
    $secondPass = makeFailingNotifier(-1)->sync();

    expect($secondPass['sent'])->toBe(1)
        ->and($failingAdmin->fresh()->unreadNotifications()->count())->toBe(1);
});
