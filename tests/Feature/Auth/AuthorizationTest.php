<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('admin can access personnel index', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/personnels');

    $response->assertOk();
});

test('non-admin cannot access personnel index', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $response = $this->actingAs($user)->get('/personnels');

    $response->assertForbidden();
})->with(['moderator', 'staff', 'teacher']);

test('admin can access statistics', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/statistics');

    $response->assertOk();
});

test('non-admin cannot access statistics', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $response = $this->actingAs($user)->get('/statistics');

    $response->assertForbidden();
})->with(['moderator', 'staff', 'teacher']);

test('admin can access backup', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/backup');

    $response->assertOk();
});

test('non-admin cannot access backup', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $response = $this->actingAs($user)->get('/backup');

    $response->assertForbidden();
})->with(['moderator', 'staff', 'teacher']);

test('admin can access system logs', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/system/logs');

    $response->assertOk();
});

test('non-admin cannot access system logs', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $response = $this->actingAs($user)->get('/system/logs');

    $response->assertForbidden();
})->with(['moderator', 'staff', 'teacher']);

test('unauthenticated user is redirected to login', function () {
    $response = $this->get('/students');

    $response->assertRedirect('/login');
});

test('unverified user cannot access dashboard routes', function () {
    $user = User::factory()->unverified()->create();

    $response = $this->actingAs($user)->get('/students');

    $response->assertRedirect(route('verification.notice'));
});
