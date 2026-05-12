<?php

use App\Models\DatabaseBackup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

function makeBackup(int $size = 0): DatabaseBackup
{
    $user = User::factory()->create();

    return DatabaseBackup::create([
        'user_id' => $user->id,
        'path' => '2026-05-10-12-00-00.zip',
        'size' => $size,
        'type' => 'manual',
        'is_scheduled' => false,
    ]);
}

it('formats size in bytes for small files', function () {
    $backup = makeBackup(500);
    expect($backup->formatted_size)->toBe('500 B');
});

it('formats size in kilobytes', function () {
    $backup = makeBackup(2048);
    expect($backup->formatted_size)->toBe('2 KB');
});

it('formats size in megabytes with two decimals', function () {
    $backup = makeBackup(5 * 1024 * 1024);
    expect($backup->formatted_size)->toBe('5 MB');
});

it('formatted_size handles a null size', function () {
    $backup = makeBackup(0);
    $backup->size = null;
    expect($backup->formatted_size)->toBe('0 B');
});

it('fileExists returns true only when the file is on disk', function () {
    Storage::fake('local');
    $backup = makeBackup(1024);

    expect($backup->fileExists())->toBeFalse();

    Storage::disk('local')->put('backup/'.$backup->path, 'content');
    expect($backup->fileExists())->toBeTrue();
});

it('getFullPath returns the absolute backup path', function () {
    $backup = makeBackup(1024);
    expect($backup->getFullPath())
        ->toEndWith('app/backup/'.$backup->path);
});

it('belongs to a user', function () {
    $backup = makeBackup(1024);
    expect($backup->user)->not->toBeNull();
    expect($backup->user)->toBeInstanceOf(User::class);
});
