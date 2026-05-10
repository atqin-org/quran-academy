<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\NotificationPreference;
use App\Models\Student;
use App\Models\User;
use App\Notifications\Payments\PaymentOverdue;
use App\Notifications\Registry;
use App\Services\Notifications\OverduePaymentNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makeOverdueStudent(): Student
{
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    return Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_credit' => -3,
        'subscription' => 1000,
    ]);
}

it('fires for student with negative credit and non-zero subscription', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    makeOverdueStudent();

    Notification::fake();
    $result = app(OverduePaymentNotifier::class)->sync();

    expect($result['sent'])->toBe(1);
    Notification::assertSentTo($admin, PaymentOverdue::class);
});

it('skips when subscription is 0 (exempt)', function () {
    User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_credit' => -5,
        'subscription' => 0,
    ]);

    $result = app(OverduePaymentNotifier::class)->sync();

    expect($result['sent'])->toBe(0);
});

it('skips when credit is non-negative', function () {
    User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_credit' => 0,
        'subscription' => 1000,
    ]);

    $result = app(OverduePaymentNotifier::class)->sync();

    expect($result['sent'])->toBe(0);
});

it('auto-resolves when credit becomes non-negative', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = makeOverdueStudent();

    app(OverduePaymentNotifier::class)->sync();
    expect($admin->fresh()->unreadNotifications()->count())->toBe(1);

    Student::query()->where('id', $student->id)->update(['sessions_credit' => 5]);
    $result = app(OverduePaymentNotifier::class)->sync();

    expect($result['resolved'])->toBe(1)
        ->and($admin->fresh()->unreadNotifications()->count())->toBe(0);
});

it('respects in_app preference: master off creates no DB row', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    NotificationPreference::create([
        'user_id' => $admin->id,
        'type' => Registry::PAYMENT_OVERDUE,
        'in_app' => false,
        'email' => false,
        'push' => false,
    ]);
    makeOverdueStudent();

    app(OverduePaymentNotifier::class)->sync();

    expect($admin->fresh()->notifications()->count())->toBe(0);
});

it('does not notify personnel with no club attachments', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    makeOverdueStudent();

    app(OverduePaymentNotifier::class)->sync();

    expect($teacher->fresh()->notifications()->count())->toBe(0);
});

it('notifies personnel attached to the student club, not personnel of other clubs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacherSame = User::factory()->create(['role' => 'teacher']);
    $teacherOther = User::factory()->create(['role' => 'teacher']);
    $otherClub = Club::factory()->create();
    $teacherOther->clubs()->attach([$otherClub->id]);

    $student = makeOverdueStudent();
    $teacherSame->clubs()->attach([$student->club_id]);

    app(OverduePaymentNotifier::class)->sync();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacherSame->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacherOther->fresh()->unreadNotifications()->count())->toBe(0);
});

it('auto-resolves all recipients when the credit clears', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create(['role' => 'teacher']);

    $student = makeOverdueStudent();
    $teacher->clubs()->attach([$student->club_id]);

    app(OverduePaymentNotifier::class)->sync();
    expect($admin->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacher->fresh()->unreadNotifications()->count())->toBe(1);

    Student::query()->where('id', $student->id)->update(['sessions_credit' => 5]);
    app(OverduePaymentNotifier::class)->sync();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(0)
        ->and($teacher->fresh()->unreadNotifications()->count())->toBe(0);
});
