<?php

namespace App\Http\Middleware;

use App\Notifications\Registry;
use App\Services\VersionChecker;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'notifications' => fn () => $this->buildNotifications($request),
            'version' => fn () => app(VersionChecker::class)->summary(),
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'invite_url' => $request->session()->get('invite_url'),
                'invite_channel' => $request->session()->get('invite_channel'),
                'invite_user' => $request->session()->get('invite_user'),
            ],
        ];
    }

    /**
     * @return array{unread: array<int, array<string, mixed>>, unread_count: int}
     */
    private function buildNotifications(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return ['unread' => [], 'unread_count' => 0];
        }

        $dismissableMap = Registry::dismissableMap();

        $unread = $user->unreadNotifications()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'data' => $n->data,
                'dismissable' => $dismissableMap[$n->type] ?? true,
                'read_at' => $n->read_at?->toIso8601String(),
                'created_at' => $n->created_at?->toIso8601String(),
            ])
            ->all();

        return [
            'unread' => $unread,
            'unread_count' => $user->unreadNotifications()->count(),
        ];
    }
}
