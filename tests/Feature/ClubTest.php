<?php

use App\Models\Club;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('authenticated user can view clubs index', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('clubs.index'));

    $response->assertOk();
});

it('clubs index shows student and user counts', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();

    Student::factory()->count(3)->create(['club_id' => $club->id]);
    $user->clubs()->attach([$club->id]);

    $response = $this->actingAs($user)->get(route('clubs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Clubs/Index')
        ->has('clubs', 1)
        ->where('clubs.0.students_count', 3)
    );
});

it('clubs index includes soft-deleted clubs', function () {
    $user = User::factory()->create();
    $activeClub = Club::factory()->create();
    $deletedClub = Club::factory()->create();
    $deletedClub->delete();

    $response = $this->actingAs($user)->get(route('clubs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Clubs/Index')
        ->has('clubs', 2)
    );
});

it('can view club create form', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('clubs.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Clubs/Create')
    );
});

it('can create a club with valid data', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('clubs.store'), [
        'name' => 'نادي التميز',
        'location' => 'حي النور',
    ]);

    $response->assertRedirect(route('clubs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('clubs', [
        'name' => 'نادي التميز',
        'location' => 'حي النور',
    ]);
});

it('creating club fails without name', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('clubs.store'), [
        'location' => 'حي النور',
    ]);

    $response->assertSessionHasErrors('name');
    $this->assertDatabaseCount('clubs', 0);
});

it('creating club fails without location', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('clubs.store'), [
        'name' => 'نادي التميز',
    ]);

    $response->assertSessionHasErrors('location');
    $this->assertDatabaseCount('clubs', 0);
});

it('can view club edit form', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();

    $response = $this->actingAs($user)->get(route('clubs.edit', $club));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Clubs/Edit')
        ->has('club')
    );
});

it('can update a club', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();

    $response = $this->actingAs($user)->post(route('clubs.update', $club), [
        'name' => 'اسم محدث',
        'location' => 'موقع محدث',
    ]);

    $response->assertRedirect(route('clubs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('clubs', [
        'id' => $club->id,
        'name' => 'اسم محدث',
        'location' => 'موقع محدث',
    ]);
});

it('can soft delete a club without students', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();

    $response = $this->actingAs($user)->delete(route('clubs.destroy', $club));

    $response->assertRedirect(route('clubs.index'));
    $response->assertSessionHas('success');

    $this->assertSoftDeleted('clubs', ['id' => $club->id]);
});

it('cannot delete a club with students', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    Student::factory()->create(['club_id' => $club->id]);

    $response = $this->actingAs($user)->delete(route('clubs.destroy', $club));

    $response->assertRedirect(route('clubs.index'));
    $response->assertSessionHas('error');

    $this->assertDatabaseHas('clubs', ['id' => $club->id, 'deleted_at' => null]);
});

it('can restore a soft-deleted club', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $club->delete();

    $response = $this->actingAs($user)->post(route('clubs.restore', $club));

    $response->assertRedirect(route('clubs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('clubs', ['id' => $club->id, 'deleted_at' => null]);
});

it('can view club show page', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();

    $response = $this->actingAs($user)->get(route('clubs.show', $club));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Clubs/Show')
        ->has('club')
        ->has('club.students')
        ->has('club.users')
    );
});
