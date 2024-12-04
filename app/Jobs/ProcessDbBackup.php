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
            // notify the user that the backup is completed
            Log::success("Backup completed for user $this->user_id: $backup_file");
        } catch (\Exception $e) {
            // notify the user that the backup failed
            Log::error("Backup failed for user $this->user_id: " . $e->getMessage());
        }
    }
}
