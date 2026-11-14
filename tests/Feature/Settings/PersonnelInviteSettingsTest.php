<?php

use App\Models\PersonnelInviteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin can view personnel invite settings', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('settings.personnel-invite.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/System/PersonnelInviteSettings')
        ->has('deliveryChannel')
    );
});

it('admin can update the delivery channel', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->put(route('settings.personnel-invite.update'), [
        'delivery_channel' => 'email',
    ]);

    $response->assertRedirect();
    expect(PersonnelInviteSetting::deliveryChannel())->toBe('email');
});

it('rejects invalid delivery channel values', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->put(route('settings.personnel-invite.update'), [
        'delivery_channel' => 'sms',
    ]);

    $response->assertSessionHasErrors('delivery_channel');
});

it('non-admin cannot access settings', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($teacher)->get(route('settings.personnel-invite.edit'));

    $response->assertForbidden();
});

it('non-admin cannot update settings', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($teacher)->put(route('settings.personnel-invite.update'), [
        'delivery_channel' => 'email',
    ]);

    $response->assertForbidden();
});
