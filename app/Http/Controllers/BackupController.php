<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessDbBackup;
use App\Jobs\ProcessDbRestore;
use App\Models\BackupSetting;
use App\Models\DatabaseBackup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    /**
     * Initiate a new backup process.
     */
    public function backup(): JsonResponse
    {
        $user_id = Auth::id();
        ProcessDbBackup::dispatch($user_id);

        activity('backup')
            ->causedBy(Auth::user())
            ->event('initiated')
            ->log('تم بدء عملية النسخ الاحتياطي');

        return response()->json([
            'success' => true,
            'message' => 'تم بدء عملية النسخ الاحتياطي بنجاح',
        ]);
    }

    /**
     * List all backups.
     */
    public function index(): JsonResponse
    {
        $backups = DatabaseBackup::with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($backups);
    }

    /**
     * Download a backup file.
     */
    public function download(string $filename): BinaryFileResponse|JsonResponse
    {
        // Security: Validate filename format (only allow specific pattern)
        // Accepts: YYYY-MM-DD-HH-MM-SS.zip or YYYY-MM-DD-HH-MM-SS-type.zip
        if (!preg_match('/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}(-(?:manual|scheduled))?\.zip$/', $filename)) {
            abort(403, 'Invalid backup filename');
        }

        // Verify backup exists in database
        $backup = DatabaseBackup::where('path', $filename)->firstOrFail();

        $backupName = config('backup.backup.name', 'backup');
        $fullPath = storage_path("app/{$backupName}/{$filename}");

        if (!file_exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'ملف النسخة الاحتياطية غير موجود',
            ], 404);
        }

        activity('backup')
            ->causedBy(Auth::user())
            ->event('downloaded')
            ->withProperties(['filename' => $filename])
            ->log('تم تحميل النسخة الاحتياطية');

        return response()->download($fullPath);
    }

    /**
     * Delete a backup.
     */
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:database_backups,id',
        ]);

        $backup = DatabaseBackup::findOrFail($validated['id']);
        $filename = $backup->path;

        // Delete file from storage
        $backupName = config('backup.backup.name', 'backup');
        $filePath = "{$backupName}/{$filename}";

        if (Storage::disk('local')->exists($filePath)) {
            Storage::disk('local')->delete($filePath);
        }

        // Delete database record
        $backup->delete();

        activity('backup')
            ->causedBy(Auth::user())
            ->event('deleted')
            ->withProperties(['filename' => $filename])
            ->log('تم حذف النسخة الاحتياطية');

        return response()->json([
            'success' => true,
            'message' => 'تم حذف النسخة الاحتياطية بنجاح',
        ]);
    }

    /**
     * Restore from a backup.
     */
    public function restore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id' => 'required|integer|exists:database_backups,id',
        ]);

        $backup = DatabaseBackup::findOrFail($validated['id']);

        if (!$backup->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => 'ملف النسخة الاحتياطية غير موجود',
            ], 404);
        }

        ProcessDbRestore::dispatch($backup->id, Auth::id());

        activity('backup')
            ->causedBy(Auth::user())
            ->event('restore_initiated')
            ->withProperties(['filename' => $backup->path])
            ->log('تم بدء عملية استعادة قاعدة البيانات');

        return response()->json([
            'success' => true,
            'message' => 'تم بدء عملية الاستعادة. سيتم إعلامك عند الانتهاء.',
        ]);
    }

    /**
     * Get backup settings.
     */
    public function getSettings(): JsonResponse
    {
        return response()->json([
            'schedule_enabled' => BackupSetting::get('schedule_enabled', false),
            'schedule_frequency' => BackupSetting::get('schedule_frequency', 'daily'),
            'schedule_minute' => BackupSetting::get('schedule_minute', 0),
            'schedule_hour' => BackupSetting::get('schedule_hour', 2),
            'schedule_day_of_week' => BackupSetting::get('schedule_day_of_week', 0),
            'schedule_day_of_month' => BackupSetting::get('schedule_day_of_month', 1),
            'max_backups' => BackupSetting::get('max_backups', 10),
            'retention_days' => BackupSetting::get('retention_days', 14),
        ]);
    }

    /**
     * Update backup settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'schedule_enabled' => 'required|boolean',
            'schedule_frequency' => 'required|in:hourly,daily,weekly,monthly',
            'schedule_minute' => 'required|integer|min:0|max:59',
            'schedule_hour' => 'required|integer|min:0|max:23',
            'schedule_day_of_week' => 'required|integer|min:0|max:6',
            'schedule_day_of_month' => 'required|integer|min:1|max:28',
            'max_backups' => 'required|integer|min:1|max:100',
            'retention_days' => 'required|integer|min:1|max:365',
        ]);

        foreach ($validated as $key => $value) {
            BackupSetting::set($key, $value);
        }

        activity('backup')
            ->causedBy(Auth::user())
            ->event('settings_updated')
            ->withProperties($validated)
            ->log('تم تحديث إعدادات النسخ الاحتياطي');

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ الإعدادات بنجاح',
        ]);
    }
}
