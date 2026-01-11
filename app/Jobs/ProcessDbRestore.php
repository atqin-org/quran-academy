<?php

namespace App\Jobs;

use App\Models\DatabaseBackup;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class ProcessDbRestore implements ShouldQueue
{
    use Queueable;

    public $timeout = 600; // 10 minutes

    public function __construct(
        public int $backupId,
        public int $userId
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $backup = DatabaseBackup::findOrFail($this->backupId);
            $backupName = config('backup.backup.name', 'backup');
            $zipPath = storage_path("app/{$backupName}/{$backup->path}");
            $backupFilename = $backup->path;

            if (!file_exists($zipPath)) {
                throw new \Exception("Backup file not found: {$backup->path}");
            }

            // Create a pre-restore backup for safety
            $this->createPreRestoreBackup();

            // Extract SQL file from ZIP
            $zip = new ZipArchive();
            if ($zip->open($zipPath) !== true) {
                throw new \Exception("Could not open backup ZIP file");
            }

            $tempDir = storage_path('app/restore-temp-' . time());
            if (!mkdir($tempDir, 0755, true) && !is_dir($tempDir)) {
                throw new \Exception("Could not create temp directory");
            }

            $zip->extractTo($tempDir);
            $zip->close();

            // Find the SQL file
            $sqlFile = $this->findSqlFile($tempDir);
            if (!$sqlFile) {
                $this->deleteDirectory($tempDir);
                throw new \Exception("No SQL file found in backup");
            }

            // Execute restore
            $this->executeSqlRestore($sqlFile);

            // Cleanup
            $this->deleteDirectory($tempDir);

            // Reconnect to database after restore
            DB::purge();
            DB::reconnect();

            // Sync backup records from filesystem
            $this->syncBackupRecordsFromFilesystem();

            Log::info("Database restored from backup: {$backupFilename}");

            // Activity logging might fail after restore, wrap it
            try {
                activity('backup')
                    ->causedBy($this->userId)
                    ->event('restored')
                    ->withProperties(['filename' => $backupFilename])
                    ->log('تم استعادة قاعدة البيانات من النسخة الاحتياطية');
            } catch (\Exception $e) {
                Log::warning("Could not log restore activity: " . $e->getMessage());
            }

        } catch (\Exception $e) {
            Log::error("Restore failed: " . $e->getMessage());

            // Try to reconnect for activity logging
            try {
                DB::purge();
                DB::reconnect();

                activity('backup')
                    ->causedBy($this->userId)
                    ->event('restore_failed')
                    ->withProperties(['error' => $e->getMessage()])
                    ->log('فشل استعادة قاعدة البيانات');
            } catch (\Exception $logError) {
                Log::warning("Could not log restore failure: " . $logError->getMessage());
            }

            throw $e;
        }
    }

    /**
     * Create a backup before restore for safety.
     */
    private function createPreRestoreBackup(): void
    {
        try {
            Artisan::call('backup:run', ['--only-db' => true]);
            Log::info("Pre-restore backup created successfully");
        } catch (\Exception $e) {
            Log::warning("Could not create pre-restore backup: " . $e->getMessage());
            // Continue with restore even if pre-restore backup fails
        }
    }

    /**
     * Find SQL file in extracted directory.
     */
    private function findSqlFile(string $dir): ?string
    {
        // Look in db-dumps folder first (spatie's default structure)
        $files = glob($dir . '/db-dumps/*.sql');
        if (empty($files)) {
            // Try root directory
            $files = glob($dir . '/*.sql');
        }
        if (empty($files)) {
            // Try recursive search
            $files = $this->findFilesRecursive($dir, '*.sql');
        }
        return $files[0] ?? null;
    }

    /**
     * Find files recursively.
     */
    private function findFilesRecursive(string $dir, string $pattern): array
    {
        $files = glob($dir . '/' . $pattern);
        foreach (glob($dir . '/*', GLOB_ONLYDIR) as $subdir) {
            $files = array_merge($files, $this->findFilesRecursive($subdir, $pattern));
        }
        return $files;
    }

    /**
     * Execute SQL restore based on database connection.
     */
    private function executeSqlRestore(string $sqlFile): void
    {
        $connection = config('database.default');
        $config = config("database.connections.{$connection}");

        if ($connection === 'mysql') {
            $this->restoreMysql($sqlFile, $config);
        } elseif ($connection === 'sqlite') {
            $this->restoreSqlite($sqlFile, $config);
        } else {
            throw new \Exception("Unsupported database connection: {$connection}");
        }
    }

    /**
     * Restore MySQL database.
     */
    private function restoreMysql(string $sqlFile, array $config): void
    {
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? 3306;
        $database = $config['database'];
        $username = $config['username'];
        $password = $config['password'];

        // Build mysql command
        $command = sprintf(
            'mysql -h %s -P %s -u %s %s %s < %s 2>&1',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            $password ? '-p' . escapeshellarg($password) : '',
            escapeshellarg($database),
            escapeshellarg($sqlFile)
        );

        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            throw new \Exception("MySQL restore failed: " . implode("\n", $output));
        }
    }

    /**
     * Restore SQLite database.
     */
    private function restoreSqlite(string $sqlFile, array $config): void
    {
        $dbPath = $config['database'];

        // Backup current database before restore
        if (file_exists($dbPath)) {
            $backupPath = $dbPath . '.pre-restore-' . time();
            copy($dbPath, $backupPath);
            Log::info("Created SQLite backup at: {$backupPath}");
        }

        // Check if there's a .sqlite file in the same directory as the SQL file
        // Spatie backup might include the actual database file
        $sqlDir = dirname($sqlFile);
        $sqliteFiles = glob($sqlDir . '/*.sqlite') ?: [];

        if (!empty($sqliteFiles)) {
            // If we found a .sqlite file, just copy it over
            $sourceDb = $sqliteFiles[0];
            if (copy($sourceDb, $dbPath)) {
                Log::info("SQLite database restored by file copy from: {$sourceDb}");
                return;
            }
        }

        // Fallback: Try to execute the SQL file
        $sql = file_get_contents($sqlFile);
        if ($sql === false) {
            throw new \Exception("Could not read SQL file");
        }

        // Convert unistr() function calls to regular strings
        // This handles the Unicode escape sequences that SQLite < 3.41 doesn't support
        $sql = $this->convertUnistrCalls($sql);

        try {
            // Delete and recreate the database file for a clean restore
            if (file_exists($dbPath)) {
                unlink($dbPath);
            }

            $pdo = new \PDO("sqlite:{$dbPath}");
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            // Execute the entire SQL as a transaction
            $pdo->exec($sql);

            Log::info("SQLite database restored successfully");
        } catch (\PDOException $e) {
            throw new \Exception("SQLite restore failed: " . $e->getMessage());
        }
    }

    /**
     * Convert unistr() function calls to regular string literals.
     * unistr() is SQLite 3.41+ and uses \uXXXX escapes.
     */
    private function convertUnistrCalls(string $sql): string
    {
        // Match unistr('...') calls, handling escaped quotes inside
        $pattern = "/unistr\('((?:[^'\\\\]|''|\\\\.)*)'\)/";

        return preg_replace_callback($pattern, function ($matches) {
            $str = $matches[1];

            // Convert \uXXXX sequences to actual characters
            $str = preg_replace_callback(
                '/\\\\u([0-9a-fA-F]{4})/',
                function ($m) {
                    $codepoint = hexdec($m[1]);
                    return mb_chr($codepoint, 'UTF-8');
                },
                $str
            );

            return "'" . $str . "'";
        }, $sql);
    }

    /**
     * Sync backup records from filesystem after restore.
     * This ensures all backup files on disk are registered in the database.
     */
    private function syncBackupRecordsFromFilesystem(): void
    {
        try {
            $backupName = config('backup.backup.name', 'backup');
            $backupPath = storage_path("app/{$backupName}");

            if (!is_dir($backupPath)) {
                return;
            }

            // Get all zip files in the backup directory
            $files = glob($backupPath . '/*.zip');

            foreach ($files as $file) {
                $filename = basename($file);

                // Check if this backup is already in the database
                $exists = DatabaseBackup::where('path', $filename)->exists();

                if (!$exists) {
                    // Parse date and type from filename
                    // Format: YYYY-MM-DD-HH-MM-SS-type.zip or YYYY-MM-DD-HH-MM-SS.zip (legacy)
                    $createdAt = null;
                    $isScheduled = false;
                    $type = 'manual';

                    // Try new format with type suffix
                    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(manual|scheduled)\.zip$/', $filename, $matches)) {
                        $createdAt = "{$matches[1]}-{$matches[2]}-{$matches[3]} {$matches[4]}:{$matches[5]}:{$matches[6]}";
                        $type = $matches[7];
                        $isScheduled = ($type === 'scheduled');
                    }
                    // Try legacy format without type suffix
                    elseif (preg_match('/^(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\.zip$/', $filename, $matches)) {
                        $createdAt = "{$matches[1]}-{$matches[2]}-{$matches[3]} {$matches[4]}:{$matches[5]}:{$matches[6]}";
                    }

                    // Create the record
                    DatabaseBackup::create([
                        'user_id' => 0, // System/unknown
                        'path' => $filename,
                        'size' => filesize($file),
                        'type' => $type,
                        'is_scheduled' => $isScheduled,
                        'created_at' => $createdAt ?? now(),
                        'updated_at' => $createdAt ?? now(),
                    ]);

                    Log::info("Synced backup record from filesystem: {$filename} (type: {$type})");
                }
            }

            // Remove records for files that no longer exist
            $allRecords = DatabaseBackup::all();
            foreach ($allRecords as $record) {
                $filePath = $backupPath . '/' . $record->path;
                if (!file_exists($filePath)) {
                    $record->delete();
                    Log::info("Removed orphaned backup record: {$record->path}");
                }
            }

        } catch (\Exception $e) {
            Log::warning("Could not sync backup records: " . $e->getMessage());
        }
    }

    /**
     * Delete directory recursively.
     */
    private function deleteDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->deleteDirectory($path) : unlink($path);
        }
        rmdir($dir);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Restore job failed completely: " . $exception->getMessage());
    }
}
