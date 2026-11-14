<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PersonnelInvitation extends Model
{
    protected $fillable = [
        'user_id',
        'token_hash',
        'sent_via',
        'expires_at',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public string $plainToken = '';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function generateFor(User $user, string $channel, int $daysValid = 7): self
    {
        static::query()->where('user_id', $user->id)->whereNull('accepted_at')->delete();

        $plain = Str::random(64);

        $invitation = static::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $plain),
            'sent_via' => $channel,
            'expires_at' => now()->addDays($daysValid),
        ]);

        $invitation->plainToken = $plain;

        return $invitation;
    }

    public static function findByToken(string $token): ?self
    {
        return static::query()
            ->where('token_hash', hash('sha256', $token))
            ->first();
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isAccepted(): bool
    {
        return $this->accepted_at !== null;
    }
}
