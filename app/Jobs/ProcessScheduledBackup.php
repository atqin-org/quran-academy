<?php

namespace App\Jobs;

use App\Concerns\BackupDatabase;
use App\Models\BackupSetting;
use App\Models\DatabaseBackup;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessScheduledBackup implements ShouldQueue
{
    use Queueable, BackupDatabase;

    public $timeout = 600; // 10 minutes for scheduled backups

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            // Use system user ID (0) for scheduled backups
            $backup_file = $this->performScheduledBackup();

            // Cleanup old backups based on settings
            $this->cleanupOldBackups();

            Log::info("Scheduled backup completed: {$backup_file}");

            activity('backup')
                ->event('scheduled_completed')
                ->withProperties(['filename' => $backup_file])
                ->log('تم إكمال النسخ الاحتياطي المجدول');

        } catch (\Exception $e) {
            Log::error("Scheduled backup failed: " . $e->getMessage());

            activity('backup')
                ->event('scheduled_failed')
                ->withProperties(['error' => $e->getMessage()])
                ->log('فشل النسخ الاحتياطي المجدول');

            throw $e;
        }
    }

    /**
     * Perform a scheduled backup (marks it as scheduled).
     */
    protected function performScheduledBackup(): string
    {
        // Run the parent performBackup with user_id 0 (system) and isScheduled = true
        return $this->performBackup(0, true);
    }

    /**
     * Cleanup old backups based on settings.
     */
    protected function cleanupOldBackups(): void
    {
        $maxBackups = BackupSetting::get('max_backups', 10);
        $retentionDays = BackupSetting::get('retention_days', 14);
        $backupName = config('backup.backup.name', 'backup');

        // Delete backups older than retention days
        $cutoffDate = now()->subDays($retentionDays);
        $oldBackups = DatabaseBackup::where('created_at', '<', $cutoffDate)->get();

        foreach ($oldBackups as $backup) {
            $filePath = "{$backupName}/{$backup->path}";
            if (Storage::disk('local')->exists($filePath)) {
                Storage::disk('local')->delete($filePath);
            }
            $backup->delete();
            Log::info("Deleted old backup: {$backup->path}");
        }

        // Keep only max_backups number of backups
        $totalBackups = DatabaseBackup::count();
        if ($totalBackups > $maxBackups) {
            $backupsToDelete = DatabaseBackup::orderBy('created_at', 'asc')
                ->limit($totalBackups - $maxBackups)
                ->get();

            foreach ($backupsToDelete as $backup) {
                $filePath = "{$backupName}/{$backup->path}";
                if (Storage::disk('local')->exists($filePath)) {
                    Storage::disk('local')->delete($filePath);
                }
                $backup->delete();
                Log::info("Deleted excess backup: {$backup->path}");
            }
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Scheduled backup job failed completely: " . $exception->getMessage());
    }
}
