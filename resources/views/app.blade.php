<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="rtl">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <!-- Favicon (light/dark mode) -->
    <link rel="icon" type="image/svg+xml" href="/images/athar-logo.svg" media="(prefers-color-scheme: light)">
    <link rel="icon" type="image/svg+xml" href="/images/athar-logo-dark.svg" media="(prefers-color-scheme: dark)">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;700&family=Alexandria:wght@400;700&display=swap"
        rel="stylesheet">
    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
    @inertiaHead

    @if (filled(config('services.umami.website_id')) && filled(config('services.umami.script_url')))
        <script
            defer
            src="{{ config('services.umami.script_url') }}"
            data-website-id="{{ config('services.umami.website_id') }}"
            @if (filled(config('services.umami.host_url'))) data-host-url="{{ config('services.umami.host_url') }}" @endif
            @if (filled(config('services.umami.domains'))) data-domains="{{ config('services.umami.domains') }}" @endif
            @if (filled(config('services.umami.tag'))) data-tag="{{ config('services.umami.tag') }}" @endif
            @if (config('services.umami.performance')) data-performance="true" @endif
        ></script>

        @if (config('services.umami.replay.enabled') && filled(config('services.umami.replay.recorder_url')))
            <script
                defer
                src="{{ config('services.umami.replay.recorder_url') }}"
                data-website-id="{{ config('services.umami.website_id') }}"
                data-sample-rate="{{ config('services.umami.replay.sample_rate') }}"
                data-mask-level="{{ config('services.umami.replay.mask_level') }}"
                data-max-duration="{{ config('services.umami.replay.max_duration') }}"
                @if (filled(config('services.umami.replay.block_selector'))) data-block-selector="{{ config('services.umami.replay.block_selector') }}" @endif
            ></script>
        @endif
    @endif
</head>

<body class="font-sans antialiased overflow-hidden">
    @inertia
</body>

</html>
