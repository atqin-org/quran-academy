<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Program;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can view programs index', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('programs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Index')
        ->has('programs')
    );
});

it('can view program create form', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('programs.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Create')
        ->has('subjects')
        ->has('clubs')
        ->has('categories')
        ->has('days')
    );
});

it('can create a program and sessions are generated', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $startDate = now()->toDateString();
    $endDate = now()->addDays(14)->toDateString();

    $response = $this->actingAs($user)->post(route('programs.store'), [
        'name' => 'Test Program',
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'days_of_week' => [
            ['value' => 'Mon', 'label' => 'Monday'],
            ['value' => 'Wed', 'label' => 'Wednesday'],
        ],
    ]);

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('programs', [
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $program = Program::where('club_id', $club->id)->first();
    expect($program)->not->toBeNull();
    expect($program->sessions()->count())->toBeGreaterThan(0);
});

it('can view program show page', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('programs.show', $program));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Show')
        ->has('program')
    );
});

it('can view program edit form', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('programs.edit', $program));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Edit')
        ->has('program')
        ->has('subjects')
        ->has('clubs')
        ->has('categories')
    );
});

it('can update a program', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $newSubject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'name' => 'Original Name',
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => ['Mon', 'Wed'],
    ]);

    $response = $this->actingAs($user)->post(route('programs.update', $program), [
        'name' => 'Updated Name',
        'subject_id' => $newSubject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => [
            ['value' => 'Tue', 'label' => 'Tuesday'],
            ['value' => 'Thu', 'label' => 'Thursday'],
        ],
    ]);

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    $program->refresh();
    expect($program->name)->toBe('Updated Name');
    expect($program->subject_id)->toBe($newSubject->id);
});

it('can delete a program', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $programId = $program->id;

    $response = $this->actingAs($user)->delete(route('programs.destroy', $program));

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('programs', ['id' => $programId]);
});
