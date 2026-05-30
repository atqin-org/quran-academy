<?php

use App\Models\Club;
use App\Models\PersonnelInvitation;
use App\Models\PersonnelInviteSetting;
use App\Models\User;
use App\Notifications\Personnel\PersonnelInvited;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

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
    Notification::fake();
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
        'status' => 'pending',
    ]);

    $newUser = User::where('email', 'ahmed@example.com')->first();
    $this->assertDatabaseHas('club_user', [
        'user_id' => $newUser->id,
        'club_id' => $club->id,
    ]);
});

it('creates personnel as pending with null password and an invitation', function () {
    Notification::fake();
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

    $user = User::where('email', 'khaled@example.com')->first();
    expect($user->password)->toBeNull();
    expect($user->status)->toBe('pending');
    expect($user->invited_at)->not->toBeNull();

    $this->assertDatabaseHas('personnel_invitations', [
        'user_id' => $user->id,
        'accepted_at' => null,
    ]);
});

it('sends PersonnelInvited notification when delivery channel includes email', function () {
    Notification::fake();
    PersonnelInviteSetting::set('delivery_channel', 'email');
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'سارة',
        'lastName' => 'حسن',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555557',
        'mail' => 'sara@example.com',
    ]);

    $user = User::where('email', 'sara@example.com')->first();
    Notification::assertSentTo($user, PersonnelInvited::class);
});

it('does not send PersonnelInvited notification when delivery channel is link only', function () {
    Notification::fake();
    PersonnelInviteSetting::set('delivery_channel', 'link');
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'فاطمة',
        'lastName' => 'خالد',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555558',
        'mail' => 'fatma@example.com',
    ]);

    $user = User::where('email', 'fatma@example.com')->first();
    Notification::assertNotSentTo($user, PersonnelInvited::class);
});

it('flashes invite_url when delivery channel is link or both', function () {
    Notification::fake();
    PersonnelInviteSetting::set('delivery_channel', 'link');
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $response = $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'يوسف',
        'lastName' => 'علي',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555559',
        'mail' => 'yousef@example.com',
    ]);

    $response->assertSessionHas('invite_url');
});

it('blocks login for pending personnel', function () {
    Notification::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'منى',
        'lastName' => 'كريم',
        'clubs' => [$club->id],
        'role' => 'teacher',
        'phone' => '0555555560',
        'mail' => 'mona@example.com',
    ]);

    auth()->logout();

    $response = $this->post(route('login'), [
        'email' => 'mona@example.com',
        'password' => 'password',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

it('admin can resend invite for pending personnel and old token is invalidated', function () {
    Notification::fake();
    $admin = User::factory()->create(['role' => 'admin']);
    $pending = User::factory()->create(['status' => 'pending', 'password' => null]);
    $originalInvitation = PersonnelInvitation::generateFor($pending, 'both');

    $response = $this->actingAs($admin)->post(route('personnels.resend-invite', $pending));

    $response->assertRedirect(route('personnels.index'));
    $this->assertDatabaseMissing('personnel_invitations', [
        'id' => $originalInvitation->id,
    ]);
    $newInvitations = PersonnelInvitation::query()->where('user_id', $pending->id)->get();
    expect($newInvitations)->toHaveCount(1);
});

it('cannot resend invite for an already-active personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $active = User::factory()->create(['status' => 'active']);

    $response = $this->actingAs($admin)->post(route('personnels.resend-invite', $active));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('error');
});

it('always flashes invite_url on resend regardless of delivery channel', function () {
    Notification::fake();
    PersonnelInviteSetting::set('delivery_channel', 'email');
    $admin = User::factory()->create(['role' => 'admin']);
    $pending = User::factory()->create(['status' => 'pending', 'password' => null]);

    $response = $this->actingAs($admin)->post(route('personnels.resend-invite', $pending));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('invite_url');
    $response->assertSessionHas('invite_user');
});

it('admin can generate a copy-link without sending email', function () {
    Notification::fake();
    PersonnelInviteSetting::set('delivery_channel', 'email');
    $admin = User::factory()->create(['role' => 'admin']);
    $pending = User::factory()->create(['status' => 'pending', 'password' => null]);

    $response = $this->actingAs($admin)->post(route('personnels.copy-invite-link', $pending));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('invite_url');
    $response->assertSessionHas('invite_user');
    Notification::assertNotSentTo($pending, PersonnelInvited::class);
});

it('cannot copy-invite-link for an already-active personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $active = User::factory()->create(['status' => 'active']);

    $response = $this->actingAs($admin)->post(route('personnels.copy-invite-link', $active));

    $response->assertRedirect(route('personnels.index'));
    $response->assertSessionHas('error');
});

it('non-admin cannot copy-invite-link', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $pending = User::factory()->create(['status' => 'pending', 'password' => null]);

    $response = $this->actingAs($teacher)->post(route('personnels.copy-invite-link', $pending));

    $response->assertForbidden();
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
