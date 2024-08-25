<?php

use App\Http\Controllers\Controller;
use App\Http\Controllers\FormController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\StudentResourceController;

Route::get('dashboard/forms', [FormController::class, 'index'])->name('forms.index');
Route::get('dashboard/forms', [FormController::class, 'index'])->name('forms.index');
Route::get('/forms/create', [FormController::class, 'create'])->name('forms.create');
Route::post('/forms', [FormController::class, 'store'])->name('forms.store');
Route::get('/forms/{form}', [FormController::class, 'edit'])->name('forms.edit');
Route::put('/forms/{form}', [FormController::class, 'update'])->name('forms.update');
Route::delete('/forms/{form}', [FormController::class, 'destroy'])->name('forms.destroy');


Route::resource('/dashboard/students', StudentResourceController::class);
Route::post('/dashboard/students/{student}', [StudentResourceController::class, 'update'])->name('students.update');

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
