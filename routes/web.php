<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StudentResourceController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\PaymentController;


Route::resource('/students', StudentResourceController::class);
Route::post('/students/{student}', [StudentResourceController::class, 'update'])->name('students.update');
Route::post('/guardian', [GuardianController::class, 'check'])->name('guardian.check');

Route::get('/students/{student}/payment', [PaymentController::class, 'show'])->name('students.payment.show');
Route::post('/students/{student}/payment', [PaymentController::class, 'store'])->name('students.payment.store');

// if (/dashboard/* dont exist) render  /Dashboard/tmp
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
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
