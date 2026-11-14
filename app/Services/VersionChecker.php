<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class VersionChecker
{
    private const REPO = 'atqin-org/quran-academy';

    private const CACHE_KEY = 'github.latest_release';

    private const CACHE_TTL = 3600;

    public function current(): ?string
    {
        $path = base_path('package.json');

        if (! is_readable($path)) {
            return null;
        }

        $decoded = json_decode(file_get_contents($path), true);

        return $decoded['version'] ?? null;
    }

    /**
     * @return array{tag: string, url: string}|null
     */
    public function latest(): ?array
    {
        $cached = Cache::remember(self::CACHE_KEY, self::CACHE_TTL, fn () => ['result' => $this->fetchLatest()]);

        return $cached['result'] ?? null;
    }

    /**
     * @return array{tag: string, url: string}|null
     */
    private function fetchLatest(): ?array
    {
        try {
            $response = Http::timeout(5)
                ->withHeaders([
                    'Accept' => 'application/vnd.github+json',
                    'User-Agent' => self::REPO,
                ])
                ->get('https://api.github.com/repos/'.self::REPO.'/releases/latest');
        } catch (ConnectionException) {
            return null;
        }

        if (! $response->ok()) {
            return null;
        }

        $tag = $response->json('tag_name');
        $url = $response->json('html_url');

        if (! is_string($tag) || ! is_string($url)) {
            return null;
        }

        return ['tag' => $tag, 'url' => $url];
    }

    /**
     * @return array{current: ?string, latest: ?string, latest_url: ?string, is_latest: ?bool, releases_url: string}
     */
    public function summary(): array
    {
        $current = $this->current();
        $latest = $this->latest();

        $latestTag = $latest['tag'] ?? null;

        return [
            'current' => $current,
            'latest' => $latestTag,
            'latest_url' => $latest['url'] ?? null,
            'is_latest' => $this->compare($current, $latestTag),
            'releases_url' => 'https://github.com/'.self::REPO.'/releases',
        ];
    }

    private function compare(?string $current, ?string $latest): ?bool
    {
        if ($current === null || $latest === null) {
            return null;
        }

        return $this->normalize($current) === $this->normalize($latest);
    }

    private function normalize(string $version): string
    {
        return ltrim(trim($version), 'vV');
    }
}
