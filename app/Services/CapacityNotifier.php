<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\Capacity\ClassOverCapacity;
use App\Notifications\Registry;
use App\Services\Notifications\TargetedNotifier;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class CapacityNotifier extends TargetedNotifier
{
    public function __construct(private CapacityMonitor $monitor) {}

    protected function notificationType(): string
    {
        return Registry::CLASS_OVER_CAPACITY;
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

    protected function currentTargets(): array
    {
        $targets = [];
        foreach ($this->monitor->getOverflows() as $overflow) {
            $key = $this->targetKeyOf($overflow);
            $targets[$key] = $overflow;
        }

        return $targets;
    }

    protected function makeNotification(array $context): Notification
    {
        return new ClassOverCapacity($context);
    }

    /**
     * @param  array<string, mixed>  $overflow
     */
    private function targetKeyOf(array $overflow): string
    {
        if (($overflow['kind'] ?? null) === 'group') {
            return 'group:'.$overflow['id'];
        }

        return 'club_category:'.$overflow['club_id'].':'.$overflow['category_id'];
    }
}
