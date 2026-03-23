<?php

use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin can view personnel index', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('personnels.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Personnels/Index')
        ->has('personnels')
        ->has('clubs')
    );
});

it('personnel index includes soft-deleted users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $deletedUser = User::factory()->create();
    $deletedUser->delete();

    $response = $this->actingAs($admin)->get(route('personnels.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Personnels/Index')
        ->where('personnels', fn ($personnels) => collect($personnels)->contains('id', $deletedUser->id))
    );
});

it('personnel index shows last activity', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('personnels.index'));

    $response->assertOk();
});

it('admin can view personnel create form', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('personnels.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Personnels/Create')
        ->has('clubs')
        ->has('categories')
    );
});

it('admin can create personnel with valid data', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $response = $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'أحمد',
        'lastName' => 'محمد',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555555',
        'mail' => 'ahmed@example.com',
    ]);

    $response->assertRedirect(route('personnels.index'));

    $this->assertDatabaseHas('users', [
        'name' => 'أحمد',
        'last_name' => 'محمد',
        'role' => 'teacher',
        'phone' => '0555555555',
        'email' => 'ahmed@example.com',
    ]);

    $newUser = User::where('email', 'ahmed@example.com')->first();
    $this->assertDatabaseHas('club_user', [
        'user_id' => $newUser->id,
        'club_id' => $club->id,
    ]);
});

it('creating personnel sets default password', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'خالد',
        'lastName' => 'علي',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555556',
        'mail' => 'khaled@example.com',
    ]);

    $response = $this->post(route('login'), [
        'email' => 'khaled@example.com',
        'password' => 'password',
    ]);

    $response->assertRedirect();
    $this->assertAuthenticated();
});

it('creating personnel fails without required fields', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $response = $this->actingAs($admin)->post(route('personnels.store'), [
        'lastName' => 'محمد',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555555',
        'mail' => 'test@example.com',
    ]);

    $response->assertSessionHasErrors('firstName');
});

it('creating personnel fails with invalid email', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $response = $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'أحمد',
        'lastName' => 'محمد',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555555',
        'mail' => 'not-an-email',
    ]);

    $response->assertSessionHasErrors('mail');
});

it('creating personnel requires at least one club', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'أحمد',
        'lastName' => 'محمد',
        'clubs' => [],
        'role' => 'teacher',
        'phone' => '0555555555',
        'mail' => 'ahmed@example.com',
    ]);

    $response->assertSessionHasErrors('clubs');
});

it('admin can view personnel edit form', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $personnel = User::factory()->create();

    $response = $this->actingAs($admin)->get(route('personnels.edit', $personnel));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Personnels/Edit')
        ->has('personnel')
        ->has('clubs')
        ->has('categories')
    );
});

it('admin can update personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $personnel = User::factory()->create();
    $personnel->clubs()->attach([$club->id]);

    $response = $this->actingAs($admin)->post(route('personnels.update.post', $personnel), [
        'firstName' => 'اسم محدث',
        'lastName' => 'لقب محدث',
        'clubs' => [$club->id],
        'role' => 'moderator',
        'phone' => '0666666666',
        'mail' => 'updated@example.com',
    ]);

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'id' => $personnel->id,
        'name' => 'اسم محدث',
        'last_name' => 'لقب محدث',
        'role' => 'moderator',
        'phone' => '0666666666',
        'email' => 'updated@example.com',
    ]);
});

it('updating personnel syncs clubs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $clubA = Club::factory()->create();
    $clubB = Club::factory()->create();
    $personnel = User::factory()->create();
    $personnel->clubs()->attach([$clubA->id]);

    $this->actingAs($admin)->post(route('personnels.update.post', $personnel), [
        'firstName' => $personnel->name,
        'lastName' => $personnel->last_name,
        'clubs' => [$clubB->id],
        'role' => $personnel->role,
        'phone' => $personnel->phone,
        'mail' => $personnel->email,
    ]);

    $this->assertDatabaseMissing('club_user', [
        'user_id' => $personnel->id,
        'club_id' => $clubA->id,
    ]);

    $this->assertDatabaseHas('club_user', [
        'user_id' => $personnel->id,
        'club_id' => $clubB->id,
    ]);
});

it('admin can soft delete personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $personnel = User::factory()->create();

    $response = $this->actingAs($admin)->delete(route('personnels.destroy', $personnel));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('success');

    $this->assertSoftDeleted('users', ['id' => $personnel->id]);
});

it('admin cannot deactivate themselves', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->delete(route('personnels.destroy', $admin));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('error');

    $this->assertDatabaseHas('users', ['id' => $admin->id, 'deleted_at' => null]);
});

it('admin can restore deactivated personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $personnel = User::factory()->create();
    $personnel->delete();

    $response = $this->actingAs($admin)->post(route('personnels.restore', $personnel));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('users', ['id' => $personnel->id, 'deleted_at' => null]);
});

it('non-admin cannot access any personnel routes', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($teacher)->get(route('personnels.index'));

    $response->assertForbidden();
});
