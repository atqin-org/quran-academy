<?php

use App\Models\PersonnelInvitation;
use App\Models\User;
use App\Notifications\Personnel\PersonnelInviteAccepted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('renders the invite page for a valid token', function () {
    $user = User::factory()->create(['status' => 'pending', 'password' => null]);
    $invitation = PersonnelInvitation::generateFor($user, 'both');

    $response = $this->get(route('personnel-invite.show', ['token' => $invitation->plainToken]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Auth/PersonnelInvite')
        ->where('email', $user->email)
    );
});

it('returns 404 for an unknown token', function () {
    $response = $this->get(route('personnel-invite.show', ['token' => 'nope']));

    $response->assertNotFound();
});

it('returns 410 for an expired token', function () {
    $user = User::factory()->create(['status' => 'pending', 'password' => null]);
    $invitation = PersonnelInvitation::generateFor($user, 'both');
    $invitation->forceFill(['expires_at' => now()->subDay()])->save();

    $response = $this->get(route('personnel-invite.show', ['token' => $invitation->plainToken]));

    $response->assertStatus(410);
});

it('returns 410 for an already-accepted token', function () {
    $user = User::factory()->create(['status' => 'pending', 'password' => null]);
    $invitation = PersonnelInvitation::generateFor($user, 'both');
    $invitation->forceFill(['accepted_at' => now()])->save();

    $response = $this->get(route('personnel-invite.show', ['token' => $invitation->plainToken]));

    $response->assertStatus(410);
});

it('sets password, activates user, logs in, and notifies admins', function () {
    Notification::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['status' => 'pending', 'password' => null, 'must_change_password' => false]);
    $invitation = PersonnelInvitation::generateFor($user, 'both');

    $response = $this->post(route('personnel-invite.store', ['token' => $invitation->plainToken]), [
        'password' => 'Str0ngP@ssword!',
        'password_confirmation' => 'Str0ngP@ssword!',
    ]);

    $response->assertRedirect(route('dashboard'));

    $user->refresh();
    expect($user->status)->toBe('active');
    expect($user->must_change_password)->toBeFalse();
    expect($user->password_set_at)->not->toBeNull();
    expect(Hash::check('Str0ngP@ssword!', $user->password))->toBeTrue();
    expect($invitation->fresh()->accepted_at)->not->toBeNull();

    $this->assertAuthenticatedAs($user);
    Notification::assertSentTo($admin, PersonnelInviteAccepted::class);
});

it('rejects weak passwords on the invite store', function () {
    $user = User::factory()->create(['status' => 'pending', 'password' => null]);
    $invitation = PersonnelInvitation::generateFor($user, 'both');

    $response = $this->post(route('personnel-invite.store', ['token' => $invitation->plainToken]), [
        'password' => 'short',
        'password_confirmation' => 'short',
    ]);

    $response->assertSessionHasErrors('password');
});
