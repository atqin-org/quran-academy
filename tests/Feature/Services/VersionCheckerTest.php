<?php

use App\Services\VersionChecker;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Cache::flush();
});

it('returns null and does not throw when GitHub connection times out', function () {
    Http::fake(function () {
        throw new ConnectionException('cURL error 28: Connection timed out');
    });

    $latest = app(VersionChecker::class)->latest();

    expect($latest)->toBeNull();
});

it('caches a null result so subsequent calls do not retry the failing request', function () {
    $calls = 0;
    Http::fake(function () use (&$calls) {
        $calls++;
        throw new ConnectionException('cURL error 28: Connection timed out');
    });

    $checker = app(VersionChecker::class);
    $checker->latest();
    $checker->latest();

    expect($calls)->toBe(1);
});

it('returns the latest release tag and url when GitHub responds successfully', function () {
    Http::fake([
        'api.github.com/*' => Http::response([
            'tag_name' => 'v1.2.3',
            'html_url' => 'https://github.com/atqin-org/quran-academy/releases/tag/v1.2.3',
        ]),
    ]);

    $latest = app(VersionChecker::class)->latest();

    expect($latest)->toBe([
        'tag' => 'v1.2.3',
        'url' => 'https://github.com/atqin-org/quran-academy/releases/tag/v1.2.3',
    ]);
});

it('exposes a summary that survives a failing GitHub call', function () {
    Http::fake(function () {
        throw new ConnectionException('boom');
    });

    $summary = app(VersionChecker::class)->summary();

    expect($summary['latest'])->toBeNull()
        ->and($summary['latest_url'])->toBeNull()
        ->and($summary['is_latest'])->toBeNull()
        ->and($summary['releases_url'])->toBe('https://github.com/atqin-org/quran-academy/releases');
});
