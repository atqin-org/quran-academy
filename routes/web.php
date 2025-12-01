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
use App\Models\DatabaseBackup;
use Illuminate\Support\Facades\Artisan;
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

    Route::get('/system', function () {
        return Inertia::render('Dashboard/System/BackupDatabase');
    })->middleware(AdminMiddleware::class);
    Route::post('/backup', [BackupController::class, 'backup']);

    Route::get('/download-backup/{path}', function ($path) {
        return response()->download(storage_path("app/$path"));
    });

    Route::get('/get-backups', function () {
        return DatabaseBackup::all();
    });
    Route::get('/bup', function () {
        Artisan::call('backup:run');
        return Artisan::output();
    });

    Route::post('/delete-backup', [BackupController::class, 'deleteBackup']);

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/system/logs', [LogController::class, 'index'])->name('admin.logs.index')->middleware(\App\Http\Middleware\AdminMiddleware::class);


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
    });

    // ---------------------------
    // Program Sessions Routes
    // ---------------------------
    Route::prefix('sessions')->name('sessions.')->group(function () {

        // Update session date/time
        Route::post('/{session}/update', [ProgramSessionController::class, 'update'])->name('update');

        // Cancel session
        Route::post('/{session}/cancel', [ProgramSessionController::class, 'cancel'])->name('cancel');

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
