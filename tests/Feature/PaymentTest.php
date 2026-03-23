<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\ClubCategorySession;
use App\Models\Payment;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can view student payment page', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.payment.show', $student));

    $response->assertOk();
});

it('can create subscription payment', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 8,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'subscription' => 1000,
        'sessions_credit' => 0,
    ]);

    $startAt = now()->toDateString();
    $endAt = now()->addMonths(3)->toDateString();

    $response = $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'sub',
        'value' => 3000,
        'status' => 'in_time',
        'discount' => null,
        'user_id' => $user->id,
        'student_id' => $student->id,
        'expect' => [
            'duration' => 3,
            'sessions' => 24,
            'change' => 0,
            'start_at' => $startAt,
            'end_at' => $endAt,
        ],
    ]);

    $response->assertRedirect(route('students.payment.show', $student));

    $this->assertDatabaseHas('payments', [
        'type' => 'sub',
        'value' => 3000,
        'status' => 'in_time',
        'student_id' => $student->id,
        'user_id' => $user->id,
    ]);
});

it('subscription payment adds session credits', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 8,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'subscription' => 1000,
        'sessions_credit' => 5,
    ]);

    $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'sub',
        'value' => 2000,
        'status' => 'in_time',
        'discount' => null,
        'user_id' => $user->id,
        'student_id' => $student->id,
        'expect' => [
            'duration' => 2,
            'sessions' => 16,
            'change' => 0,
            'start_at' => now()->toDateString(),
            'end_at' => now()->addMonths(2)->toDateString(),
        ],
    ]);

    $student->refresh();
    // 5 existing + (2 months * 8 sessions_per_month) = 5 + 16 = 21
    expect($student->sessions_credit)->toBe(21);
});

it('can create insurance payment with value forced to 200', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'insurance_expire_at' => null,
    ]);

    $response = $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'ins',
        'value' => 999,
        'status' => 'in_time',
        'discount' => null,
        'user_id' => $user->id,
        'student_id' => $student->id,
        'expect' => [
            'duration' => 33,
            'sessions' => 0,
            'change' => 0,
            'start_at' => now()->toDateString(),
            'end_at' => now()->addYear()->toDateString(),
        ],
    ]);

    $response->assertRedirect(route('students.payment.show', $student));

    // Value should be forced to 200 regardless of what was sent
    $this->assertDatabaseHas('payments', [
        'type' => 'ins',
        'value' => 200,
        'student_id' => $student->id,
    ]);
});

it('insurance payment sets expiry to next october 31', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'insurance_expire_at' => null,
    ]);

    Carbon::setTestNow(Carbon::create(2026, 3, 15));

    $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'ins',
        'value' => 200,
        'status' => 'in_time',
        'discount' => null,
        'user_id' => $user->id,
        'student_id' => $student->id,
        'expect' => [
            'duration' => 33,
            'sessions' => 0,
            'change' => 0,
            'start_at' => now()->toDateString(),
            'end_at' => '2026-10-31',
        ],
    ]);

    $student->refresh();
    expect($student->insurance_expire_at->format('Y-m-d'))->toBe('2026-10-31');

    Carbon::setTestNow();
});

it('insurance renewal extends from current expiry when in last month', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Set "now" to October 15, 2026 - within the last month before Oct 31 expiry
    Carbon::setTestNow(Carbon::create(2026, 10, 15));

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'insurance_expire_at' => Carbon::create(2026, 10, 31),
    ]);

    $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'ins',
        'value' => 200,
        'status' => 'in_time',
        'discount' => null,
        'user_id' => $user->id,
        'student_id' => $student->id,
        'expect' => [
            'duration' => 33,
            'sessions' => 0,
            'change' => 0,
            'start_at' => now()->toDateString(),
            'end_at' => '2027-10-31',
        ],
    ]);

    $student->refresh();
    // Since we are in the same month as expiry, it should extend to NEXT October 31
    expect($student->insurance_expire_at->format('Y-m-d'))->toBe('2027-10-31');

    Carbon::setTestNow();
});

it('payment requires authentication', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->get(route('students.payment.show', $student));

    $response->assertRedirect(route('login'));
});

it('payment page returns 404 for nonexistent student', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('students.payment.show', 99999));

    $response->assertNotFound();
});

it('returns validation errors instead of crashing when expect is missing', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'ins',
        'value' => 200,
        'status' => 'in_time',
        'user_id' => $user->id,
        'student_id' => $student->id,
        // expect is missing entirely
    ]);

    $response->assertSessionHasErrors([
        'expect.duration',
        'expect.sessions',
        'expect.change',
        'expect.start_at',
        'expect.end_at',
    ]);
});

it('returns validation errors for invalid payment data', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->post(route('students.payment.store', $student), [
        'type' => 'invalid_type',
        'value' => 'not_a_number',
        'status' => '',
        'user_id' => $user->id,
        'student_id' => $student->id,
    ]);

    $response->assertSessionHasErrors(['type', 'value', 'status']);
});

it('payment page shows existing payments', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    // Create some payments manually
    Payment::create([
        'type' => 'sub',
        'value' => 1500,
        'status' => 'in_time',
        'start_at' => now()->subMonth(),
        'end_at' => now()->addMonth(),
        'user_id' => $user->id,
        'student_id' => $student->id,
    ]);

    Payment::create([
        'type' => 'ins',
        'value' => 200,
        'status' => 'in_time',
        'start_at' => now()->subMonth(),
        'end_at' => now()->addMonths(6),
        'user_id' => $user->id,
        'student_id' => $student->id,
    ]);

    $response = $this->actingAs($user)->get(route('students.payment.show', $student));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Students/Payment')
        ->has('payments', 2)
        ->has('student')
        ->has('sessionsPerMonth')
    );
});
