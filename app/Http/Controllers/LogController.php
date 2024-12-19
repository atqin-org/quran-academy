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
        $logs = $query->paginate(10);
        //dd(Inertia::merge(ActivityLogResource::collection($logs)->collection->toArray()));
        return Inertia::render('Dashboard/System/Logs/Index', [
            'logs' => Inertia::merge(ActivityLogResource::collection($logs)->collection->toArray()),
            'page' => $logs->currentPage(),
            'filters' => [
                'type' => $type,
                'sort' => $sort
            ]
        ]);
    }
}
