<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StudentResourceController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PersonnelController;
use App\Http\Controllers\BackupController;
use App\Models\DatabaseBackup;
use Illuminate\Support\Facades\Artisan;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('/students', StudentResourceController::class);
    Route::post('/students/{student}', [StudentResourceController::class, 'update'])->name('students.update');

    Route::get('/students/{student}/payment', [PaymentController::class, 'show'])->name('students.payment.show');
    Route::post('/students/{student}/payment', [PaymentController::class, 'store'])->name('students.payment.store');

    Route::resource('/personnels', PersonnelController::class)->only(['index', 'create', 'store'])
        ->middleware(\App\Http\Middleware\AdminMiddleware::class);

    Route::get('/system', function () {
        return Inertia::render('Dashboard/System/BackupDatabase');
    })->middleware(\App\Http\Middleware\AdminMiddleware::class);

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
});

Route::get('/dashboard/{any}', function () {
    return Inertia::render('Dashboard/Tmp');
})->where('any', '.*');

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return redirect()->route('students.index');
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__ . '/auth.php';
