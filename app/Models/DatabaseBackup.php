<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class DatabaseBackup extends Model
{
    protected $table = 'database_backups';

    protected $fillable = [
        'user_id',
        'path',
        'size',
        'type',
        'is_scheduled',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'size' => 'integer',
        'is_scheduled' => 'boolean',
    ];

    protected $appends = ['formatted_size'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get formatted file size.
     */
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size ?? 0;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if the backup file exists on disk.
     */
    public function fileExists(): bool
    {
        $backupName = config('backup.backup.name', 'backup');
        return Storage::disk('local')->exists("{$backupName}/{$this->path}");
    }

    /**
     * Get the full path to the backup file.
     */
    public function getFullPath(): string
    {
        $backupName = config('backup.backup.name', 'backup');
        return storage_path("app/{$backupName}/{$this->path}");
    }
}
