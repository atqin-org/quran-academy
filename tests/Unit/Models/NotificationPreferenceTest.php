<?php

use App\Models\NotificationPreference;
use App\Models\User;
use App\Notifications\Registry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('casts the channel flags to booleans', function () {
    $user = User::factory()->create();
    $pref = NotificationPreference::create([
        'user_id' => $user->id,
        'type' => Registry::CLASS_OVER_CAPACITY,
        'in_app' => 1,
        'email' => 0,
        'push' => 1,
    ]);

    $fresh = $pref->fresh();
    expect($fresh->in_app)->toBeTrue();
    expect($fresh->email)->toBeFalse();
    expect($fresh->push)->toBeTrue();
});

it('belongs to a user', function () {
    $user = User::factory()->create();
    $pref = NotificationPreference::create([
        'user_id' => $user->id,
        'type' => Registry::CLASS_OVER_CAPACITY,
        'in_app' => true,
        'email' => false,
        'push' => false,
    ]);

    expect($pref->user)->not->toBeNull();
    expect($pref->user->id)->toBe($user->id);
});
