<?php

namespace App\Concerns;

use Illuminate\Support\Str;
use App\Models\DatabaseBackup;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Spatie\Backup\Helpers\Format;

trait BackupDatabase
{
    /**
     * Perform the database backup using spatie/laravel-backup package.
     */
    protected function performBackup(int $user_id)
    {
        try {
            
            // Run the backup:run Artisan command
            Artisan::call('backup:run');

            // Get the path to the latest backup file
            $backupDestination = config('backup.backup.destination.disks')[0];
            $backupPath = storage_path("app/{$backupDestination}/" . now()->format('Y-m-d-H-i-s') . '.zip');

            // Create a record of the backup
            $backup_file = basename($backupPath);
            DatabaseBackup::create([
                'user_id' => $user_id,
                'path' => $backup_file,
            ]);

            return $backup_file;
        } catch (\Exception $e) {
            // Handle or rethrow the exception
            Log::error("Backup process failed for user $user_id: " . $e->getMessage());
            throw $e;
        }
    }
}
