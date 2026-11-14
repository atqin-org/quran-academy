<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Routes that remain accessible while a user is forced to change their password.
     *
     * @var array<int, string>
     */
    protected array $allowed = [
        'force-password.show',
        'force-password.update',
        'logout',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && $user->must_change_password) {
            $routeName = $request->route()?->getName();

            if (! in_array($routeName, $this->allowed, true)) {
                return redirect()->route('force-password.show');
            }
        }

        return $next($request);
    }
}
