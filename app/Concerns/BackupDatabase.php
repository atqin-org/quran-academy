<?php

namespace App\Concerns;

use App\Models\DatabaseBackup;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

trait BackupDatabase
{
    /**
     * Perform the database backup using spatie/laravel-backup package.
     *
     * @param int $user_id The user ID who initiated the backup
     * @param bool $isScheduled Whether this is a scheduled backup
     */
    protected function performBackup(int $user_id, bool $isScheduled = false): ?string
    {
        try {
            // Run the backup:run Artisan command (database only for faster backups)
            Artisan::call('backup:run', ['--only-db' => true]);

            // Get the backup configuration
            $backupName = config('backup.backup.name', 'backup');
            $diskName = config('backup.backup.destination.disks')[0] ?? 'local';

            // Find the most recent backup file in the backup directory
            $backupDir = "{$backupName}";
            $files = Storage::disk($diskName)->files($backupDir);

            // Filter to only zip files and sort by modification time
            $zipFiles = array_filter($files, fn($file) => str_ends_with($file, '.zip'));

            if (empty($zipFiles)) {
                throw new \Exception('No backup file was created');
            }

            // Get the most recent file (last modified)
            $newestBackup = collect($zipFiles)
                ->sortByDesc(fn($file) => Storage::disk($diskName)->lastModified($file))
                ->first();

            $originalFilename = basename($newestBackup);

            // Rename file to include type (manual/scheduled)
            $type = $isScheduled ? 'scheduled' : 'manual';
            $newFilename = $this->renameBackupWithType($diskName, $backupDir, $originalFilename, $type);

            // Check if this backup already exists in database (avoid duplicates)
            $existingBackup = DatabaseBackup::where('path', $newFilename)->first();
            if ($existingBackup) {
                Log::info("Backup already recorded: {$newFilename}");
                return $newFilename;
            }

            // Get file size
            $size = Storage::disk($diskName)->size("{$backupDir}/{$newFilename}");

            // Create a record of the backup
            DatabaseBackup::create([
                'user_id' => $user_id,
                'path' => $newFilename,
                'size' => $size,
                'type' => $type,
                'is_scheduled' => $isScheduled,
            ]);

            return $newFilename;
        } catch (\Exception $e) {
            Log::error("Backup process failed for user {$user_id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Rename backup file to include type suffix.
     * Changes: 2024-12-01-16-30-00.zip -> 2024-12-01-16-30-00-manual.zip
     */
    protected function renameBackupWithType(string $diskName, string $backupDir, string $originalFilename, string $type): string
    {
        // Check if file already has a type suffix
        if (preg_match('/-(manual|scheduled)\.zip$/', $originalFilename)) {
            return $originalFilename;
        }

        // Create new filename with type
        $newFilename = preg_replace('/\.zip$/', "-{$type}.zip", $originalFilename);

        // Rename the file
        $oldPath = "{$backupDir}/{$originalFilename}";
        $newPath = "{$backupDir}/{$newFilename}";

        if (Storage::disk($diskName)->exists($oldPath)) {
            Storage::disk($diskName)->move($oldPath, $newPath);
            Log::info("Renamed backup: {$originalFilename} -> {$newFilename}");
        }

        return $newFilename;
    }
}
