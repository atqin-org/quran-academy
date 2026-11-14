<?php

namespace App\Console\Commands;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeEmptyGuardians extends Command
{
    protected $signature = 'students:purge-empty-guardians {--dry-run : Report what would change without modifying the database}';

    protected $description = 'Delete Guardian rows whose name, phone, and job are all blank, and null the matching father_id/mother_id on students.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $emptyGuardianIds = Guardian::query()
            ->where(function ($q) {
                $q->whereNull('name')->orWhere('name', '');
            })
            ->where(function ($q) {
                $q->whereNull('phone')->orWhere('phone', '');
            })
            ->where(function ($q) {
                $q->whereNull('job')->orWhere('job', '');
            })
            ->pluck('id');

        if ($emptyGuardianIds->isEmpty()) {
            $this->info('No empty guardians found.');

            return self::SUCCESS;
        }

        $fatherLinks = Student::withTrashed()
            ->whereIn('father_id', $emptyGuardianIds)
            ->count();
        $motherLinks = Student::withTrashed()
            ->whereIn('mother_id', $emptyGuardianIds)
            ->count();

        $this->info("Empty guardians: {$emptyGuardianIds->count()}");
        $this->info("Students linked via father_id: {$fatherLinks}");
        $this->info("Students linked via mother_id: {$motherLinks}");

        if ($dryRun) {
            $this->warn('Dry run — no changes applied.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($emptyGuardianIds) {
            Student::withTrashed()
                ->whereIn('father_id', $emptyGuardianIds)
                ->update(['father_id' => null]);

            Student::withTrashed()
                ->whereIn('mother_id', $emptyGuardianIds)
                ->update(['mother_id' => null]);

            Guardian::whereIn('id', $emptyGuardianIds)->delete();
        });

        $this->info('Done.');

        return self::SUCCESS;
    }
}
