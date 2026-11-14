<p align="center">
    <img src="public/images/athar-logo.svg" width="150" alt="Athar Logo">
</p>

<h1 align="center">Athar - أثر</h1>

<p align="center">
    Quran Academy Management System
</p>

## Admin Account
set the admin account in the .env file before running the seeders
```
ADMIN_EMAIL=your-email
ADMIN_PASSWORD=your-password
```

## Analytics (optional)

Athar can stream privacy-friendly, cookieless usage stats to a [Umami](https://umami.is/) instance (Cloud or self-hosted, v3.x). Set two env vars and you're done:

```
UMAMI_WEBSITE_ID=your-website-id
UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js   # or https://your-umami.example.com/script.js
```

When both are set, the tracker is injected into the page and SPA navigations are captured automatically. Logged-in users are linked to their Umami session via `umami.identify()`, so the *Sessions* view in your Umami dashboard shows the user's name, email, and role. View all stats from the Umami dashboard itself.

Leave `UMAMI_WEBSITE_ID` empty to disable — no script is loaded and no analytics calls are made.

Optional tracker knobs (see `.env.example`): `UMAMI_HOST_URL`, `UMAMI_DOMAINS`, `UMAMI_TAG`, `UMAMI_PERFORMANCE` (Core Web Vitals, v3.1+).

### Replays (optional)

If your Umami instance has [Replays](https://docs.umami.is/docs/replays) enabled, Athar can also load the recorder. Set:

```
UMAMI_REPLAY=true
UMAMI_REPLAY_RECORDER_URL=https://cloud.umami.is/recorder.js   # or https://your-umami.example.com/recorder.js
```

Defaults match Umami's recommended values: 15% sample rate, "moderate" mask level, 5-minute max duration. Override via `UMAMI_REPLAY_SAMPLE_RATE`, `UMAMI_REPLAY_MASK_LEVEL`, `UMAMI_REPLAY_MAX_DURATION`, `UMAMI_REPLAY_BLOCK_SELECTOR` if needed. Replays must also be enabled per-website in the Umami dashboard before recordings are stored.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
