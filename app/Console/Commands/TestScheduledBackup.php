<?php

namespace App\Console\Commands;

use App\Jobs\ProcessScheduledBackup;
use App\Models\BackupSetting;
use Illuminate\Console\Command;

class TestScheduledBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:test-scheduled {--force : Force run even if not enabled}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the scheduled backup job';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $enabled = BackupSetting::get('schedule_enabled', false);

        $this->info('Current backup settings:');
        $this->table(
            ['Setting', 'Value'],
            [
                ['schedule_enabled', $enabled ? 'Yes' : 'No'],
                ['schedule_frequency', BackupSetting::get('schedule_frequency', 'daily')],
                ['schedule_minute', BackupSetting::get('schedule_minute', 0)],
                ['schedule_hour', BackupSetting::get('schedule_hour', 2)],
                ['schedule_day_of_week', BackupSetting::get('schedule_day_of_week', 0)],
                ['schedule_day_of_month', BackupSetting::get('schedule_day_of_month', 1)],
            ]
        );

        if (!$enabled && !$this->option('force')) {
            $this->warn('Scheduled backup is disabled. Use --force to run anyway.');
            return 1;
        }

        $this->info('Dispatching scheduled backup job...');
        ProcessScheduledBackup::dispatch();
        $this->info('Job dispatched successfully! Check the queue worker for results.');

        return 0;
    }
}
