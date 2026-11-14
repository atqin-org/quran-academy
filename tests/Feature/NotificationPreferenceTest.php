<?php

use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\Registry;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('profile edit page exposes each registered type with current or default values', function () {
    $user = User::factory()->create();
    NotificationPreference::create([
        'user_id' => $user->id,
        'type' => Registry::CLASS_OVER_CAPACITY,
        'in_app' => false,
        'email' => true,
        'push' => false,
    ]);

    $response = $this->actingAs($user)->get(route('profile.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Profile/Edit')
        ->has('preferences', count(Registry::all()))
        ->where('preferences.0.type', Registry::CLASS_OVER_CAPACITY)
        ->where('preferences.0.in_app', false)
        ->where('preferences.0.email', true)
    );
});

it('profile edit page returns sensible preference defaults when no row exists', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('profile.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('preferences.0.in_app', true)
        ->where('preferences.0.email', false)
        ->where('preferences.0.push', false)
    );
});

it('update upserts the preference rows', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->put(route('profile.notifications.update'), [
        'preferences' => [[
            'type' => Registry::CLASS_OVER_CAPACITY,
            'in_app' => false,
            'email' => true,
        ]],
    ]);

    $response->assertRedirect();
    $row = NotificationPreference::where('user_id', $user->id)
        ->where('type', Registry::CLASS_OVER_CAPACITY)
        ->first();

    expect($row)->not->toBeNull()
        ->and($row->in_app)->toBeFalse()
        ->and($row->email)->toBeTrue()
        ->and($row->push)->toBeFalse();
});

it('rejects unregistered type strings', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->from(route('profile.edit'))
        ->put(route('profile.notifications.update'), [
            'preferences' => [[
                'type' => 'totally_made_up_type',
                'in_app' => true,
                'email' => false,
            ]],
        ]);

    $response->assertSessionHasErrors('preferences.0.type');
});

it('forces push to false even if submitted as true', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->put(route('profile.notifications.update'), [
        'preferences' => [[
            'type' => Registry::CLASS_OVER_CAPACITY,
            'in_app' => true,
            'email' => false,
            'push' => true,
        ]],
    ]);

    $row = NotificationPreference::where('user_id', $user->id)->first();
    expect($row->push)->toBeFalse();
});
