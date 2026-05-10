<?php

namespace App\Http\Controllers;

use App\Notifications\Registry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->query('filter') === 'all' ? 'all' : 'unread';

        $query = $request->user()->notifications();
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        $dismissableMap = Registry::dismissableMap();

        $notifications = $query->latest()->paginate(20)->withQueryString();
        $notifications->getCollection()->transform(fn ($n) => [
            'id' => $n->id,
            'type' => $n->type,
            'data' => $n->data,
            'dismissable' => $dismissableMap[$n->type] ?? true,
            'read_at' => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toIso8601String(),
        ]);

        return Inertia::render('Dashboard/Notifications/Index', [
            'notifications' => $notifications,
            'filter' => $filter,
        ]);
    }

    public function markRead(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);

        if (! Registry::isDismissable($notification->type)) {
            abort(422, 'This notification type is not dismissable.');
        }

        $notification->markAsRead();

        return redirect()->back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $nonDismissableTypes = collect(Registry::dismissableMap())
            ->reject(fn (bool $v) => $v)
            ->keys()
            ->all();

        $query = $request->user()->unreadNotifications();
        if (! empty($nonDismissableTypes)) {
            $query->whereNotIn('type', $nonDismissableTypes);
        }
        $query->update(['read_at' => now()]);

        return redirect()->back();
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);

        if (! Registry::isDismissable($notification->type)) {
            abort(422, 'This notification type is not dismissable.');
        }

        $notification->delete();

        return redirect()->back();
    }
}
