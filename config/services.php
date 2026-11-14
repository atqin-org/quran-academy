<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'umami' => [
        'website_id' => env('UMAMI_WEBSITE_ID'),
        'script_url' => env('UMAMI_SCRIPT_URL'),
        'host_url' => env('UMAMI_HOST_URL'),
        'domains' => env('UMAMI_DOMAINS'),
        'tag' => env('UMAMI_TAG'),
        'performance' => env('UMAMI_PERFORMANCE', false),

        'replay' => [
            'enabled' => env('UMAMI_REPLAY', false),
            'recorder_url' => env('UMAMI_REPLAY_RECORDER_URL'),
            'sample_rate' => env('UMAMI_REPLAY_SAMPLE_RATE', '0.15'),
            'mask_level' => env('UMAMI_REPLAY_MASK_LEVEL', 'moderate'),
            'max_duration' => env('UMAMI_REPLAY_MAX_DURATION', '300000'),
            'block_selector' => env('UMAMI_REPLAY_BLOCK_SELECTOR'),
        ],
    ],

];
