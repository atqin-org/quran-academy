<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('redirects users with must_change_password from any authenticated route', function () {
    $user = User::factory()->create([
        'must_change_password' => true,
        'role' => 'admin',
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertRedirect(route('force-password.show'));
});

it('lets users see the force-password page even with the flag set', function () {
    $user = User::factory()->create(['must_change_password' => true]);

    $response = $this->actingAs($user)->get(route('force-password.show'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Auth/ForcePasswordChange'));
});

it('updates the password and clears the flag', function () {
    $user = User::factory()->create([
        'must_change_password' => true,
        'password' => Hash::make('OldPass1!'),
    ]);

    $response = $this->actingAs($user)->put(route('force-password.update'), [
        'current_password' => 'OldPass1!',
        'password' => 'NewStr0ngPass!',
        'password_confirmation' => 'NewStr0ngPass!',
    ]);

    $response->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->must_change_password)->toBeFalse();
    expect($user->password_set_at)->not->toBeNull();
    expect(Hash::check('NewStr0ngPass!', $user->password))->toBeTrue();
});

it('rejects an incorrect current password', function () {
    $user = User::factory()->create([
        'must_change_password' => true,
        'password' => Hash::make('OldPass1!'),
    ]);

    $response = $this->actingAs($user)->put(route('force-password.update'), [
        'current_password' => 'WrongPass!',
        'password' => 'NewStr0ngPass!',
        'password_confirmation' => 'NewStr0ngPass!',
    ]);

    $response->assertSessionHasErrors('current_password');
    expect($user->fresh()->must_change_password)->toBeTrue();
});

it('rejects a new password identical to the current one', function () {
    $user = User::factory()->create([
        'must_change_password' => true,
        'password' => Hash::make('SamePass1!'),
    ]);

    $response = $this->actingAs($user)->put(route('force-password.update'), [
        'current_password' => 'SamePass1!',
        'password' => 'SamePass1!',
        'password_confirmation' => 'SamePass1!',
    ]);

    $response->assertSessionHasErrors('password');
});

it('does not affect users without the flag', function () {
    $user = User::factory()->create([
        'must_change_password' => false,
        'role' => 'admin',
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertRedirect(route('students.index'));
});
