<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\ClubCategorySession;
use App\Models\Group;
use App\Models\NotificationPreference;
use App\Models\Student;
use App\Models\User;
use App\Notifications\Capacity\ClassOverCapacity;
use App\Notifications\Registry;
use App\Services\CapacityNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('sends class_over_capacity to every admin when an overflow appears', function () {
    $admin1 = User::factory()->create(['role' => 'admin']);
    $admin2 = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    Notification::fake();
    $result = app(CapacityNotifier::class)->sync();

    expect($result['sent'])->toBe(2)
        ->and($result['resolved'])->toBe(0);
    Notification::assertSentTo($admin1, ClassOverCapacity::class);
    Notification::assertSentTo($admin2, ClassOverCapacity::class);
});

it('does not duplicate while an unread notification with same target_key exists', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();
    expect($admin->unreadNotifications()->count())->toBe(1);

    app(CapacityNotifier::class)->sync();
    expect($admin->unreadNotifications()->count())->toBe(1);
});

it('auto-marks-read an unread notification whose target no longer overflows', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();
    expect($admin->unreadNotifications()->count())->toBe(1);

    $group->update(['capacity' => 99]);
    $result = app(CapacityNotifier::class)->sync();

    expect($result['resolved'])->toBe(1)
        ->and($admin->fresh()->unreadNotifications()->count())->toBe(0)
        ->and($admin->notifications()->count())->toBe(1);
});

it('does not notify users whose role is not admin', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();

    expect($teacher->notifications()->count())->toBe(0);
});

it('re-fires after a resolved overflow recurs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();
    $group->update(['capacity' => 99]);
    app(CapacityNotifier::class)->sync(); // resolves
    $group->update(['capacity' => 1]);
    app(CapacityNotifier::class)->sync();

    expect($admin->unreadNotifications()->count())->toBe(1)
        ->and($admin->notifications()->count())->toBe(2); // 1 read + 1 unread
});

it('respects in_app preference: master off creates no DB row', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    NotificationPreference::create([
        'user_id' => $admin->id,
        'type' => Registry::CLASS_OVER_CAPACITY,
        'in_app' => false,
        'email' => false,
        'push' => false,
    ]);

    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();

    expect($admin->notifications()->count())->toBe(0);
});

it('respects email preference: master on + email on dispatches mail channel', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    NotificationPreference::create([
        'user_id' => $admin->id,
        'type' => Registry::CLASS_OVER_CAPACITY,
        'in_app' => true,
        'email' => true,
        'push' => false,
    ]);

    $club = Club::factory()->create();
    $category = Category::factory()->create();
    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 12,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    app(CapacityNotifier::class)->sync();

    Notification::assertSentTo($admin, ClassOverCapacity::class, function ($notification, array $channels) {
        return in_array('database', $channels) && in_array('mail', $channels);
    });
});

it('notifies personnel attached to the affected club, not personnel of other clubs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $clubX = Club::factory()->create();
    $clubY = Club::factory()->create();
    $teacherX = User::factory()->create(['role' => 'teacher']);
    $teacherX->clubs()->attach([$clubX->id]);
    $teacherY = User::factory()->create(['role' => 'teacher']);
    $teacherY->clubs()->attach([$clubY->id]);

    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $clubX->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $clubX->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacherX->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacherY->fresh()->unreadNotifications()->count())->toBe(0);
});

it('does not notify personnel with no club attachments', function () {
    User::factory()->create(['role' => 'admin']);
    $orphanTeacher = User::factory()->create(['role' => 'teacher']);

    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();

    expect($orphanTeacher->fresh()->notifications()->count())->toBe(0);
});

it('ClassOverCapacity toMail renders the capacity-overflow view with the right data', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $notification = new ClassOverCapacity([
        'kind' => 'group',
        'id' => 42,
        'club_name' => 'نادي الفردوس',
        'category_name' => 'الكبار',
        'group_name' => 'الفوج 1',
        'current' => 17,
        'capacity' => 15,
        'manage_url' => '/groups/manage/1/2',
        'club_id' => 1,
        'category_id' => 2,
    ]);

    $mail = $notification->toMail($admin);

    expect($mail->subject)->toBe('تجاوز السعة الاستيعابية');
    expect($mail->view)->toBe('emails.capacity-overflow');
    expect($mail->viewData['title'])->toContain('نادي الفردوس')
        ->and($mail->viewData['title'])->toContain('فوج');
    expect($mail->viewData['current'])->toBe(17);
    expect($mail->viewData['capacity'])->toBe(15);
    expect($mail->viewData['manageUrl'])->toBe('/groups/manage/1/2');
});

it('auto-resolves all recipients when overflow clears', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create(['role' => 'teacher']);
    $club = Club::factory()->create();
    $teacher->clubs()->attach([$club->id]);

    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();
    expect($admin->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacher->fresh()->unreadNotifications()->count())->toBe(1);

    $group->update(['capacity' => 99]);
    app(CapacityNotifier::class)->sync();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(0)
        ->and($teacher->fresh()->unreadNotifications()->count())->toBe(0);
});
