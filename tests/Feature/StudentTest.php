<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Helper to build valid student store payload.
 *
 * @return array<string, mixed>
 */
function validStudentPayload(Club $club, Category $category, array $overrides = []): array
{
    return array_merge([
        'firstName' => 'أحمد',
        'lastName' => 'بن علي',
        'gender' => 'male',
        'birthdate' => now()->subYears(10)->format('Y-m-d'),
        'socialStatus' => 'good',
        'hasCronicDisease' => 'no',
        'cronicDisease' => null,
        'familyStatus' => null,
        'father' => [
            'phone' => '0551234567',
            'name' => 'علي',
            'job' => 'مهندس',
        ],
        'mother' => [
            'phone' => '0661234567',
            'name' => 'فاطمة',
            'job' => null,
        ],
        'subscription' => 1000,
        'club' => $club->id,
        'category' => $category->id,
        'group_id' => null,
        'insurance' => false,
        'picture' => null,
        'file' => null,
        'memorizationDirection' => 'descending',
    ], $overrides);
}

// -------------------------------------------------------
// Index
// -------------------------------------------------------

it('renders the students index page', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Club::factory()->create();
    Category::factory()->create();

    $response = $this->actingAs($user)->get(route('students.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Dashboard/Students/Index'));
});

it('returns paginated student data', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(12)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Students/Index')
        ->has('students.data', 10)
    );
});

it('respects per_page parameter', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(15)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['per_page' => 25]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 15)
    );
});

it('falls back to 10 per page for invalid per_page value', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(15)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['per_page' => 999]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 10)
    );
});

it('can search students by name', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'first_name' => 'محمد',
        'last_name' => 'الأمين',
    ]);

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'first_name' => 'خالد',
        'last_name' => 'عبدالله',
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['search' => 'محمد']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 1)
    );
});

it('can filter students by gender', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'gender' => 'male',
    ]);

    Student::factory()->count(2)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'gender' => 'female',
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['gender' => ['female']]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 2)
    );
});

it('can filter students by category', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $catA = Category::factory()->create();
    $catB = Category::factory()->create();

    Student::factory()->count(4)->create([
        'club_id' => $club->id,
        'category_id' => $catA->id,
    ]);

    Student::factory()->count(2)->create([
        'club_id' => $club->id,
        'category_id' => $catB->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['categories' => [$catA->id]]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 4)
    );
});

it('can filter students by club', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $clubA = Club::factory()->create();
    $clubB = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(3)->create([
        'club_id' => $clubA->id,
        'category_id' => $category->id,
    ]);

    Student::factory()->count(5)->create([
        'club_id' => $clubB->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['clubs' => [$clubB->id]]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 5)
    );
});

it('can sort students by name ascending', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'first_name' => 'يوسف',
        'last_name' => 'أحمد',
    ]);

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'first_name' => 'أحمد',
        'last_name' => 'محمد',
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['sortBy' => 'name', 'sortType' => 'asc']));

    $response->assertOk();
    $response->assertInertia(function ($page) {
        $page->component('Dashboard/Students/Index');
        $students = $page->toArray()['props']['students']['data'];
        expect($students[0]['first_name'])->toBe('أحمد');
    });
});

it('can sort students by birthdate descending', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $older = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'birthdate' => '2000-01-01',
    ]);

    $younger = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'birthdate' => '2015-06-15',
    ]);

    $response = $this->actingAs($user)->get(route('students.index', ['sortBy' => 'birthdate', 'sortType' => 'desc']));

    $response->assertOk();
    $response->assertInertia(function ($page) use ($younger) {
        $students = $page->toArray()['props']['students']['data'];
        expect($students[0]['id'])->toBe($younger->id);
    });
});

// -------------------------------------------------------
// Authorization / Club scoping
// -------------------------------------------------------

it('non-admin user only sees students from their clubs', function () {
    $clubA = Club::factory()->create();
    $clubB = Club::factory()->create();
    $category = Category::factory()->create();

    $user = User::factory()->create(['role' => 'teacher']);
    $user->clubs()->attach($clubA);

    Student::factory()->count(3)->create([
        'club_id' => $clubA->id,
        'category_id' => $category->id,
    ]);

    Student::factory()->count(4)->create([
        'club_id' => $clubB->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 3)
    );
});

it('admin sees all students across all clubs', function () {
    $clubA = Club::factory()->create();
    $clubB = Club::factory()->create();
    $category = Category::factory()->create();

    $admin = User::factory()->create(['role' => 'admin']);

    Student::factory()->count(3)->create([
        'club_id' => $clubA->id,
        'category_id' => $category->id,
    ]);

    Student::factory()->count(4)->create([
        'club_id' => $clubB->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($admin)->get(route('students.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 7)
    );
});

// -------------------------------------------------------
// Create form
// -------------------------------------------------------

it('renders the create student form', function () {
    $user = User::factory()->create(['role' => 'admin']);
    Club::factory()->create();
    Category::factory()->create();

    $response = $this->actingAs($user)->get(route('students.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Dashboard/Students/Create'));
});

// -------------------------------------------------------
// Store
// -------------------------------------------------------

it('can create a student with valid data', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $payload = validStudentPayload($club, $category);

    $response = $this->actingAs($user)->post(route('students.store'), $payload);

    $response->assertRedirect(route('students.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('students', [
        'first_name' => 'أحمد',
        'last_name' => 'بن علي',
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);
});

it('creating a student also creates father and mother guardians', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $guardianCountBefore = Guardian::count();

    $payload = validStudentPayload($club, $category);

    $this->actingAs($user)->post(route('students.store'), $payload);

    expect(Guardian::count())->toBe($guardianCountBefore + 2);

    $this->assertDatabaseHas('guardians', [
        'phone' => '0551234567',
        'gender' => 'male',
    ]);

    $this->assertDatabaseHas('guardians', [
        'phone' => '0661234567',
        'gender' => 'female',
    ]);
});

it('store fails without firstName', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $payload = validStudentPayload($club, $category, ['firstName' => '']);

    $response = $this->actingAs($user)->post(route('students.store'), $payload);

    $response->assertSessionHasErrors('firstName');
});

it('store fails with birthdate less than 3 years ago', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $payload = validStudentPayload($club, $category, [
        'birthdate' => now()->subYear()->format('Y-m-d'),
    ]);

    $response = $this->actingAs($user)->post(route('students.store'), $payload);

    $response->assertSessionHasErrors('birthdate');
});

it('store fails without any phone number', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $payload = validStudentPayload($club, $category, [
        'father' => [
            'phone' => null,
            'name' => 'علي',
            'job' => 'مهندس',
        ],
        'mother' => [
            'phone' => null,
            'name' => 'فاطمة',
            'job' => null,
        ],
    ]);

    $response = $this->actingAs($user)->post(route('students.store'), $payload);

    $response->assertSessionHasErrors();
});

it('store validates phone format', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $payload = validStudentPayload($club, $category, [
        'father' => [
            'phone' => '12345',
            'name' => 'علي',
            'job' => 'مهندس',
        ],
        'mother' => [
            'phone' => null,
            'name' => 'فاطمة',
            'job' => null,
        ],
    ]);

    $response = $this->actingAs($user)->post(route('students.store'), $payload);

    $response->assertSessionHasErrors('father.phone');
});

// -------------------------------------------------------
// Show
// -------------------------------------------------------

it('renders the student show page', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.show', $student));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Dashboard/Students/Show'));
});

// -------------------------------------------------------
// Edit
// -------------------------------------------------------

it('renders the student edit form', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.edit', $student));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('Dashboard/Students/Update'));
});

// -------------------------------------------------------
// Update
// -------------------------------------------------------

it('can update a student', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $father = Guardian::factory()->create(['gender' => 'male']);
    $mother = Guardian::factory()->create(['gender' => 'female']);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'father_id' => $father->id,
        'mother_id' => $mother->id,
    ]);

    $payload = validStudentPayload($club, $category, [
        'firstName' => 'عمر',
        'lastName' => 'المختار',
    ]);

    $response = $this->actingAs($user)->post(route('students.update', $student), $payload);

    $response->assertRedirect(route('students.index'));

    $student->refresh();
    expect($student->first_name)->toBe('عمر')
        ->and($student->last_name)->toBe('المختار');
});

// -------------------------------------------------------
// Soft Delete
// -------------------------------------------------------

it('can soft delete a student', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->delete(route('students.destroy', $student));

    $this->assertSoftDeleted('students', ['id' => $student->id]);
});

it('soft delete redirects back', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)
        ->from(route('students.index'))
        ->delete(route('students.destroy', $student));

    $response->assertRedirect(route('students.index'));
    $response->assertSessionHas('success');
});

// -------------------------------------------------------
// Ahzab
// -------------------------------------------------------

it('can update student ahzab', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'ahzab_up' => 5,
        'ahzab_down' => 3,
    ]);

    $response = $this->actingAs($user)->put(route('students.ahzab', $student), [
        'ahzab_up' => 10,
        'ahzab_down' => 15,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $student->refresh();
    expect($student->ahzab_up)->toBe(10)
        ->and($student->ahzab_down)->toBe(15)
        ->and($student->ahzab)->toBe(25);
});

it('ahzab update fails when sum exceeds 60', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->put(route('students.ahzab', $student), [
        'ahzab_up' => 35,
        'ahzab_down' => 30,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasErrors('ahzab_up');
});

// -------------------------------------------------------
// Direction
// -------------------------------------------------------

it('can update student memorization direction', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'memorization_direction' => 'descending',
    ]);

    $response = $this->actingAs($user)->put(route('students.direction', $student), [
        'direction' => 'ascending',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $student->refresh();
    expect($student->memorization_direction)->toBe('ascending');
});

// -------------------------------------------------------
// Export
// -------------------------------------------------------

it('can export students', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.export'));

    $response->assertOk();
    $response->assertDownload();
});

it('export respects club filter', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $clubA = Club::factory()->create();
    $clubB = Club::factory()->create();
    $category = Category::factory()->create();

    Student::factory()->count(2)->create([
        'club_id' => $clubA->id,
        'category_id' => $category->id,
    ]);

    Student::factory()->count(3)->create([
        'club_id' => $clubB->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($admin)->get(route('students.export', ['clubs' => [$clubA->id]]));

    $response->assertOk();
    $response->assertDownload();
});
