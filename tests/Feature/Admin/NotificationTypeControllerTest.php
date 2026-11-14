<?php

use App\Models\NotificationTypeSetting;
use App\Models\User;
use App\Notifications\Registry;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin can view the notification types page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('admin.notificationTypes.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/System/NotificationTypes')
        ->has('types', count(Registry::all()))
    );
});

it('update upserts dismissable settings per type', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $payload = collect(Registry::types())
        ->map(fn (string $type) => ['type' => $type, 'dismissable' => true])
        ->all();

    $this->actingAs($admin)
        ->put(route('admin.notificationTypes.update'), ['types' => $payload])
        ->assertRedirect();

    foreach (Registry::types() as $type) {
        expect(NotificationTypeSetting::query()->where('type', $type)->value('dismissable'))
            ->toBeTrue();
    }
});

it('rejects unknown notification type strings', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->from(route('admin.notificationTypes.index'))
        ->put(route('admin.notificationTypes.update'), [
            'types' => [['type' => 'totally_fake_type', 'dismissable' => true]],
        ]);

    $response->assertSessionHasErrors('types.0.type');
});

it('blocks non-admin access', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $this->actingAs($teacher)
        ->get(route('admin.notificationTypes.index'))
        ->assertForbidden();
});
