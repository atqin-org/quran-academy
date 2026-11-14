<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogResource;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class LogController extends Controller
{
    public function index(Request $request): Response
    {
        $type = $request->input('type', 'all');
        $sort = $request->input('sort', 'desc');
        $search = trim((string) $request->input('search', ''));
        $causerId = $request->input('causer_id');
        $event = $request->input('event');
        $datePreset = $request->input('date_preset', 'all');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        [$from, $to] = $this->resolveDateRange($datePreset, $dateFrom, $dateTo);

        $query = Activity::query()->with('causer');

        if ($type !== 'all') {
            $query->where('log_name', $type);
        }

        if ($causerId) {
            $query->where('causer_id', (int) $causerId)
                ->where('causer_type', User::class);
        }

        if ($event) {
            $query->where('event', $event);
        }

        if ($from) {
            $query->where('created_at', '>=', $from);
        }

        if ($to) {
            $query->where('created_at', '<=', $to);
        }

        if ($search !== '') {
            $needle = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($w) use ($needle) {
                $w->where('description', 'like', $needle)
                    // Full scan; acceptable at current volume. Replace with a JSON path index or generated column at scale.
                    ->orWhereRaw('CAST(properties AS CHAR) LIKE ?', [$needle])
                    ->orWhereHas('causer', fn ($c) => $c->where('name', 'like', $needle));
            });
        }

        $sort === 'asc' ? $query->oldest() : $query->latest();

        $causerOptions = User::query()
            ->whereIn('id', Activity::query()->whereNotNull('causer_id')->distinct()->pluck('causer_id'))
            ->whereIn('role', ['admin', 'moderator', 'staff', 'teacher'])
            ->orderBy('name')
            ->get(['id', 'name', 'last_name']);

        return Inertia::render('Dashboard/System/Logs/Index', [
            'logs' => Inertia::scroll(fn () => ActivityLogResource::collection($query->paginate(15))),
            'filters' => [
                'type' => $type,
                'sort' => $sort,
                'search' => $search,
                'causer_id' => $causerId ? (int) $causerId : null,
                'event' => $event,
                'date_preset' => $datePreset,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'causerOptions' => $causerOptions,
        ]);
    }

    /**
     * @return array{0: ?Carbon, 1: ?Carbon}
     */
    private function resolveDateRange(string $preset, ?string $from, ?string $to): array
    {
        return match ($preset) {
            'today' => [Carbon::today(), Carbon::today()->endOfDay()],
            'last_7' => [Carbon::today()->subDays(6)->startOfDay(), Carbon::today()->endOfDay()],
            'last_30' => [Carbon::today()->subDays(29)->startOfDay(), Carbon::today()->endOfDay()],
            'custom' => [
                $from ? Carbon::parse($from)->startOfDay() : null,
                $to ? Carbon::parse($to)->endOfDay() : null,
            ],
            default => [null, null],
        };
    }
}
