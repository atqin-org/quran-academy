<?php

namespace App\Jobs;

use App\Concerns\BackupDatabase;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessDbBackup implements ShouldQueue
{
    use Queueable, BackupDatabase;

    public $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(public int $user_id)
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $backup_file = $this->performBackup($this->user_id);

            activity('backup')
                ->causedBy($this->user_id)
                ->event('completed')
                ->withProperties(['filename' => $backup_file])
                ->log('تم إكمال النسخ الاحتياطي');

            Log::info("Backup completed for user {$this->user_id}: {$backup_file}");

        } catch (\Exception $e) {
            activity('backup')
                ->causedBy($this->user_id)
                ->event('failed')
                ->withProperties(['error' => $e->getMessage()])
                ->log('فشل النسخ الاحتياطي');

            Log::error("Backup failed for user {$this->user_id}: " . $e->getMessage());

            throw $e; // Re-throw to mark job as failed
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Backup job failed completely: " . $exception->getMessage());
    }
}
