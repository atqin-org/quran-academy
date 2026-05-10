<?php

use App\Models\User;
use App\Notifications\Registry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

function seedNotification(User $user, string $type = 'generic_update', array $data = [], ?DateTimeInterface $readAt = null): string
{
    $id = (string) Str::uuid();
    $user->notifications()->create([
        'id' => $id,
        'type' => $type,
        'data' => $data + ['title' => 'Hello', 'message' => 'World'],
        'read_at' => $readAt,
    ]);

    return $id;
}

it('returns the user own notifications, defaulting to unread', function () {
    $user = User::factory()->create();
    $unreadId = seedNotification($user, 'generic_update');
    seedNotification($user, 'generic_update', [], now()); // read

    $response = $this->actingAs($user)->get(route('notifications.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Notifications/Index')
        ->where('filter', 'unread')
        ->has('notifications.data', 1)
        ->where('notifications.data.0.id', $unreadId)
    );
});

it('returns all notifications when filter=all', function () {
    $user = User::factory()->create();
    seedNotification($user, 'generic_update');
    seedNotification($user, 'generic_update', [], now());

    $response = $this->actingAs($user)->get(route('notifications.index', ['filter' => 'all']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('filter', 'all')
        ->has('notifications.data', 2)
    );
});

it('marks a non-capacity notification as read', function () {
    $user = User::factory()->create();
    $id = seedNotification($user, 'generic_update');

    $this->actingAs($user)->post(route('notifications.read', $id))->assertRedirect();

    expect($user->fresh()->unreadNotifications()->count())->toBe(0);
});

it('rejects markRead on a class_over_capacity notification', function () {
    $user = User::factory()->create();
    $id = seedNotification($user, Registry::CLASS_OVER_CAPACITY);

    $response = $this->actingAs($user)->post(route('notifications.read', $id));

    $response->assertStatus(422);
    expect($user->fresh()->unreadNotifications()->count())->toBe(1);
});

it('markAllRead leaves capacity notifications unread', function () {
    $user = User::factory()->create();
    seedNotification($user, 'generic_update');
    seedNotification($user, Registry::CLASS_OVER_CAPACITY);

    $this->actingAs($user)->post(route('notifications.readAll'))->assertRedirect();

    $unread = $user->fresh()->unreadNotifications()->get();
    expect($unread)->toHaveCount(1)
        ->and($unread->first()->type)->toBe(Registry::CLASS_OVER_CAPACITY);
});

it('destroys a non-capacity notification', function () {
    $user = User::factory()->create();
    $id = seedNotification($user, 'generic_update');

    $this->actingAs($user)->delete(route('notifications.destroy', $id))->assertRedirect();

    expect($user->fresh()->notifications()->count())->toBe(0);
});

it('rejects destroy on a class_over_capacity notification', function () {
    $user = User::factory()->create();
    $id = seedNotification($user, Registry::CLASS_OVER_CAPACITY);

    $response = $this->actingAs($user)->delete(route('notifications.destroy', $id));

    $response->assertStatus(422);
    expect($user->fresh()->notifications()->count())->toBe(1);
});

it('returns 404 when acting on another user notification', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();
    $id = seedNotification($other, 'generic_update');

    $this->actingAs($user)->post(route('notifications.read', $id))->assertNotFound();
    $this->actingAs($user)->delete(route('notifications.destroy', $id))->assertNotFound();
});
