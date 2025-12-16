<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StudentResourceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PersonnelController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\ProgramController;
use App\Http\Controllers\ProgramSessionController;
use App\Http\Controllers\ClubController;
use App\Http\Controllers\ClubCategorySessionController;
use App\Http\Controllers\StatisticsController;
use App\Http\Middleware\AdminMiddleware;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('/students', StudentResourceController::class);
    Route::post('/students/{student}', [StudentResourceController::class, 'update'])->name('students.update');
    Route::put('/students/ahzab/{student}', [StudentResourceController::class, 'ahzab'])->name('students.ahzab');
    Route::put('/students/{student}/direction', [StudentResourceController::class, 'updateDirection'])->name('students.direction');
    Route::get('/studentsExport', [StudentResourceController::class, 'export'])->name('students.export');

    Route::get('/students/{student}/payment', [PaymentController::class, 'show'])->name('students.payment.show');
    Route::post('/students/{student}/payment', [PaymentController::class, 'store'])->name('students.payment.store');

    Route::resource('/personnels', PersonnelController::class)
        ->middleware(AdminMiddleware::class);
    Route::post('/personnels/{personnel}', [PersonnelController::class, 'update'])
        ->name('personnels.update.post')
        ->middleware(AdminMiddleware::class);
    Route::post('/personnels/{personnel}/restore', [PersonnelController::class, 'restore'])
        ->name('personnels.restore')
        ->middleware(AdminMiddleware::class);

    Route::get('/system/backup', function () {
        return Inertia::render('Dashboard/System/BackupDatabase');
    })->middleware(AdminMiddleware::class);

    // Backup Routes - Admin Only
    Route::middleware(AdminMiddleware::class)->prefix('backup')->group(function () {
        Route::post('/', [BackupController::class, 'backup'])->name('backup.create');
        Route::get('/', [BackupController::class, 'index'])->name('backup.index');
        Route::get('/download/{filename}', [BackupController::class, 'download'])
            ->name('backup.download')
            ->where('filename', '[\d]{4}-[\d]{2}-[\d]{2}-[\d]{2}-[\d]{2}-[\d]{2}\.zip');
        Route::delete('/', [BackupController::class, 'destroy'])->name('backup.destroy');
        Route::post('/restore', [BackupController::class, 'restore'])->name('backup.restore');
        Route::get('/settings', [BackupController::class, 'getSettings'])->name('backup.settings');
        Route::put('/settings', [BackupController::class, 'updateSettings'])->name('backup.settings.update');
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/system/logs', [LogController::class, 'index'])->name('admin.logs.index')->middleware(\App\Http\Middleware\AdminMiddleware::class);

    // ---------------------------
    // Statistics Routes (Admin Only)
    // ---------------------------
    Route::middleware(AdminMiddleware::class)->prefix('statistics')->name('statistics.')->group(function () {
        Route::get('/', [StatisticsController::class, 'index'])->name('index');
        Route::get('/data', [StatisticsController::class, 'getData'])->name('data');
        Route::put('/layout', [StatisticsController::class, 'updateLayout'])->name('layout.update');
        Route::delete('/layout', [StatisticsController::class, 'resetLayout'])->name('layout.reset');
    });

    // ---------------------------
    // Clubs Routes
    // ---------------------------
    Route::prefix('clubs')->name('clubs.')->group(function () {
        Route::get('/', [ClubController::class, 'index'])->name('index');
        Route::get('/create', [ClubController::class, 'create'])->name('create');
        Route::post('/', [ClubController::class, 'store'])->name('store');
        Route::get('/{club}/edit', [ClubController::class, 'edit'])->name('edit');
        Route::post('/{club}', [ClubController::class, 'update'])->name('update');
        Route::delete('/{club}', [ClubController::class, 'destroy'])->name('destroy');
        Route::post('/{club}/restore', [ClubController::class, 'restore'])->name('restore');

        // Session configuration routes
        Route::get('/{club}/sessions-config', [ClubCategorySessionController::class, 'edit'])->name('sessions-config.edit');
        Route::put('/{club}/sessions-config', [ClubCategorySessionController::class, 'update'])->name('sessions-config.update');
    });

    // ---------------------------
    // Programs Routes
    // ---------------------------
    Route::prefix('programs')->name('programs.')->group(function () {


         // Update program
        Route::post('/{program}', [ProgramController::class, 'update'])->name('update');


        // List all programs
        Route::get('/', [ProgramController::class, 'index'])->name('index');

        // Create program form
        Route::get('/create', [ProgramController::class, 'create'])->name('create');

        // Store new program
        Route::post('/', [ProgramController::class, 'store'])->name('store');

        // Show program details
        Route::get('/{program}', [ProgramController::class, 'show'])->name('show');

        // Edit program form
        Route::get('/{program}/edit', [ProgramController::class, 'edit'])->name('edit');

       
        // Delete program
        Route::delete('/{program}', [ProgramController::class, 'destroy'])->name('destroy');

        // Add exceptional session to program
        Route::post('/{program}/sessions', [ProgramSessionController::class, 'store'])->name('sessions.store');
    });

    // ---------------------------
    // Program Sessions Routes
    // ---------------------------
    Route::prefix('sessions')->name('sessions.')->group(function () {

        // Update session date/time
        Route::post('/{session}/update', [ProgramSessionController::class, 'update'])->name('update');

        // Cancel session
        Route::post('/{session}/cancel', [ProgramSessionController::class, 'cancel'])->name('cancel');

        // Toggle optional status
        Route::put('/{session}/optional', [ProgramSessionController::class, 'toggleOptional'])->name('toggleOptional');

        // Attendance page for a session
        Route::get('/{session}/attendance', [ProgramSessionController::class, 'attendance'])->name('attendance');

        // Record attendance
        Route::post('/{session}/attendance', [ProgramSessionController::class, 'recordAttendance'])->name('recordAttendance');
    });
});

Route::get('/dashboard/{any}', function () {
    return Inertia::render('Dashboard/Tmp');
})->where('any', '.*');


Route::get('/', function () {
    return redirect()->route('login');
});


Route::get('/dashboard', function () {
    return redirect()->route('students.index');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {})->middleware(\App\Http\Middleware\AdminMiddleware::class);

require __DIR__ . '/auth.php';
