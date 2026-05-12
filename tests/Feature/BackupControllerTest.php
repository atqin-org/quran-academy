<?php

use App\Jobs\ProcessDbBackup;
use App\Jobs\ProcessDbRestore;
use App\Models\BackupSetting;
use App\Models\DatabaseBackup;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
});

it('backup dispatches ProcessDbBackup job for admin', function () {
    Bus::fake();

    $this->actingAs($this->admin)
        ->postJson(route('backup.create'))
        ->assertSuccessful()
        ->assertJson(['success' => true]);

    Bus::assertDispatched(ProcessDbBackup::class);
});

it('index returns backups ordered by created_at desc', function () {
    $older = DatabaseBackup::create([
        'user_id' => $this->admin->id,
        'path' => '2026-01-01-00-00-00.zip',
        'size' => 1024,
        'type' => 'manual',
        'is_scheduled' => false,
    ]);
    $older->forceFill(['created_at' => now()->subDay()])->saveQuietly();

    $newer = DatabaseBackup::create([
        'user_id' => $this->admin->id,
        'path' => '2026-05-01-00-00-00.zip',
        'size' => 2048,
        'type' => 'manual',
        'is_scheduled' => false,
    ]);
    $newer->forceFill(['created_at' => now()])->saveQuietly();

    $response = $this->actingAs($this->admin)
        ->getJson(route('backup.index'));

    $response->assertSuccessful();
    $payload = $response->json();
    expect($payload)->toHaveCount(2);
    expect($payload[0]['id'])->toBe($newer->id);
    expect($payload[1]['id'])->toBe($older->id);
});

it('destroy validates that id exists', function () {
    $this->actingAs($this->admin)
        ->deleteJson(route('backup.destroy'), ['id' => 999999])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('id');
});

it('destroy deletes the file and database row', function () {
    Storage::fake('local');
    $backup = DatabaseBackup::create([
        'user_id' => $this->admin->id,
        'path' => '2026-05-10-12-00-00.zip',
        'size' => 1024,
        'type' => 'manual',
        'is_scheduled' => false,
    ]);
    Storage::disk('local')->put('backup/'.$backup->path, 'fake-content');

    $this->actingAs($this->admin)
        ->deleteJson(route('backup.destroy'), ['id' => $backup->id])
        ->assertSuccessful()
        ->assertJson(['success' => true]);

    Storage::disk('local')->assertMissing('backup/'.$backup->path);
    expect(DatabaseBackup::find($backup->id))->toBeNull();
});

it('restore returns 404 when the backup file is missing', function () {
    Storage::fake('local');
    Bus::fake();
    $backup = DatabaseBackup::create([
        'user_id' => $this->admin->id,
        'path' => '2026-05-10-12-00-00.zip',
        'size' => 1024,
        'type' => 'manual',
        'is_scheduled' => false,
    ]);

    $this->actingAs($this->admin)
        ->postJson(route('backup.restore'), ['id' => $backup->id])
        ->assertNotFound()
        ->assertJson(['success' => false]);

    Bus::assertNotDispatched(ProcessDbRestore::class);
});

it('restore dispatches ProcessDbRestore when the file exists', function () {
    Storage::fake('local');
    Bus::fake();
    $backup = DatabaseBackup::create([
        'user_id' => $this->admin->id,
        'path' => '2026-05-10-12-00-00.zip',
        'size' => 1024,
        'type' => 'manual',
        'is_scheduled' => false,
    ]);
    Storage::disk('local')->put('backup/'.$backup->path, 'fake-content');

    $this->actingAs($this->admin)
        ->postJson(route('backup.restore'), ['id' => $backup->id])
        ->assertSuccessful()
        ->assertJson(['success' => true]);

    Bus::assertDispatched(ProcessDbRestore::class);
});

it('getSettings returns the eight default keys', function () {
    $response = $this->actingAs($this->admin)
        ->getJson(route('backup.settings'));

    $response->assertSuccessful();
    $response->assertJsonStructure([
        'schedule_enabled',
        'schedule_frequency',
        'schedule_minute',
        'schedule_hour',
        'schedule_day_of_week',
        'schedule_day_of_month',
        'max_backups',
        'retention_days',
    ]);
    expect($response->json('schedule_frequency'))->toBe('daily');
    expect($response->json('max_backups'))->toBe(10);
});

it('updateSettings validates and persists all keys', function () {
    $payload = [
        'schedule_enabled' => true,
        'schedule_frequency' => 'weekly',
        'schedule_minute' => 30,
        'schedule_hour' => 4,
        'schedule_day_of_week' => 3,
        'schedule_day_of_month' => 15,
        'max_backups' => 25,
        'retention_days' => 60,
    ];

    $this->actingAs($this->admin)
        ->putJson(route('backup.settings.update'), $payload)
        ->assertSuccessful()
        ->assertJson(['success' => true]);

    foreach ($payload as $key => $value) {
        expect(BackupSetting::get($key))->toBe($value);
    }
});

it('updateSettings rejects an invalid frequency', function () {
    $this->actingAs($this->admin)
        ->putJson(route('backup.settings.update'), [
            'schedule_enabled' => true,
            'schedule_frequency' => 'yearly',
            'schedule_minute' => 0,
            'schedule_hour' => 2,
            'schedule_day_of_week' => 0,
            'schedule_day_of_month' => 1,
            'max_backups' => 10,
            'retention_days' => 14,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('schedule_frequency');
});

it('blocks non-admin users from backup routes', function (string $method, string $routeName, array $params, array $body) {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $this->actingAs($teacher)
        ->json($method, route($routeName, $params), $body)
        ->assertForbidden();
})->with([
    'index' => ['GET', 'backup.index', [], []],
    'create' => ['POST', 'backup.create', [], []],
    'destroy' => ['DELETE', 'backup.destroy', [], ['id' => 1]],
    'restore' => ['POST', 'backup.restore', [], ['id' => 1]],
    'settings.get' => ['GET', 'backup.settings', [], []],
    'settings.update' => ['PUT', 'backup.settings.update', [], []],
]);
