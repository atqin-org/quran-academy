<?php

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'admin',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('new moderator can register', function () {
    $response = $this->post('/register', [
        'name' => 'Moderator User',
        'email' => 'moderator@example.com',
        'role' => 'moderator',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('new staff can register', function () {
    $response = $this->post('/register', [
        'name' => 'Staff User',
        'email' => 'staff@example.com',
        'role' => 'staff',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('new teacher can register', function () {
    $response = $this->post('/register', [
        'name' => 'Teacher User',
        'email' => 'teacher@example.com',
        'role' => 'teacher',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('registration fails with invalid role', function () {
    $response = $this->post('/register', [
        'name' => 'Invalid Role User',
        'email' => 'invalidrole@example.com',
        'role' => 'invalid_role',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors(['role']);
});
