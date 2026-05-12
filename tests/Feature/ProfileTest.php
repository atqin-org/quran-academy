<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'last_name' => 'Family',
            'phone' => '0555123456',
            'email' => 'test@example.com',
            'avatar_style' => 'initials',
            'avatar_color' => '#3b82f6',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
    expect($user->avatar_style)->toBe('initials');
    expect($user->avatar_color)->toBe('#3b82f6');
});

test('avatar_color is cleared when switching to a non-initials style', function () {
    $user = User::factory()->create([
        'avatar_style' => 'initials',
        'avatar_color' => '#ff0000',
    ]);

    $this->actingAs($user)
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'hashvatar',
            'avatar_color' => '#ff0000',
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->avatar_color)->toBeNull();
    expect($user->fresh()->avatar_style)->toBe('hashvatar');
});

test('avatar_variant persists for boring style and clears for others', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'boring',
            'avatar_variant' => 'marble',
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->avatar_variant)->toBe('marble');

    $this->actingAs($user)
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'initials',
            'avatar_variant' => 'marble',
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->avatar_variant)->toBeNull();
});

test('avatar_color rejects malformed values', function (string $value) {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/profile')
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'initials',
            'avatar_color' => $value,
        ])
        ->assertSessionHasErrors('avatar_color');
})->with([
    'named color' => ['red'],
    'invalid hex chars' => ['#zzzzzz'],
    'too short' => ['#abc'],
    'missing hash' => ['ff0000'],
]);

test('hashvatar options persist and clear when style switches away', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'hashvatar',
            'hashvatar_mode' => 'dither',
            'hashvatar_animated' => true,
            'hashvatar_tones' => 'ocean',
        ])
        ->assertSessionHasNoErrors();

    $fresh = $user->fresh();
    expect($fresh->hashvatar_mode)->toBe('dither');
    expect($fresh->hashvatar_animated)->toBeTrue();
    expect($fresh->hashvatar_tones)->toBe('ocean');

    // switch away — hashvatar fields should clear
    $this->actingAs($user)
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'initials',
            'hashvatar_mode' => 'dither',
        ])
        ->assertSessionHasNoErrors();

    $cleared = $user->fresh();
    expect($cleared->hashvatar_mode)->toBeNull();
    expect($cleared->hashvatar_animated)->toBeNull();
    expect($cleared->hashvatar_tones)->toBeNull();
});

test('hashvatar fields reject unknown enum values', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/profile')
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'hashvatar',
            'hashvatar_mode' => 'rainbow',
            'hashvatar_tones' => 'galactic',
        ])
        ->assertSessionHasErrors(['hashvatar_mode', 'hashvatar_tones']);
});

test('avatar_style rejects unknown values', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from('/profile')
        ->patch('/profile', [
            'name' => $user->name,
            'last_name' => $user->last_name,
            'phone' => $user->phone,
            'email' => $user->email,
            'avatar_style' => 'photo',
        ])
        ->assertSessionHasErrors('avatar_style');
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch('/profile', [
            'name' => 'Test User',
            'last_name' => 'Family',
            'phone' => '0555123456',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    // Admins are blocked from self-deleting (see ProfileController::destroy),
    // so this test uses a non-admin role.
    $user = User::factory()->create(['role' => 'teacher']);

    $response = $this
        ->actingAs($user)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect($user->fresh()->deleted_at)->not->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create(['role' => 'teacher']);

    $response = $this
        ->actingAs($user)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    expect($user->fresh())->not->toBeNull();
});

test('soft deleted user cannot log in', function () {
    $user = User::factory()->create();
    $user->delete();

    $response = $this
        ->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasErrors('email')
        ->assertRedirect('/');

    $this->assertGuest();
});

test('soft deleted user can be restored', function () {
    $user = User::factory()->create();
    $user->delete();

    $this->assertSoftDeleted($user);

    $user->restore();

    $this->assertNotSoftDeleted($user);
});

test('restored user can log in', function () {
    $user = User::factory()->create();
    $user->delete();
    $user->restore();

    $response = $this
        ->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

    $response->assertRedirect('/dashboard');
    $this->assertAuthenticatedAs($user);
});

test('restored user can access profile page', function () {
    $user = User::factory()->create();
    $user->delete();
    $user->restore();

    $response = $this
        ->actingAs($user)
        ->get('/profile');

    $response->assertOk();
});
