<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;
use App\Http\Resources\ActivityLogResource;

class LogController extends Controller
{
    public function index()
    {
        $type = request('type', 'all');
        $sort = request('sort', 'desc');

        $query = ($sort === 'asc') ? Activity::oldest() : Activity::latest();
        if ($type !== 'all') {
            $query->where('log_name', $type);
        }

        return Inertia::render('Dashboard/System/Logs/Index', [
            'logs' => Inertia::scroll(fn () => ActivityLogResource::collection($query->paginate(15))),
            'filters' => [
                'type' => $type,
                'sort' => $sort
            ]
        ]);
    }
}
