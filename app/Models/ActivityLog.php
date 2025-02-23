<?php

namespace App\Models;

use Spatie\Activitylog\Models\Activity;

class ActivityLog extends Activity
{
    public static function getLogsByType(string $type = null, string $sort = 'desc')
    {
        $query = self::query();

        if ($type && $type !== 'all') {
            $query->where('log_name', $type);
        }
        if ($sort === 'asc') {
            $query->oldest();
        } else {
            $query->latest();
        }
        return $query->paginate(3)->through(fn ($log) => $log->getFormattedLog());
    }

    public function getFormattedLog()
    {
        return [
            'id' => $this->id,
            'type' => $this->log_name,
            'description' => $this->description,
            'causer' => $this->causer ? [
                'name' => $this->causer->name,
                'email' => $this->causer->email,
            ] : null,
            'properties' => $this->properties,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
