<?php

namespace App\Providers;

use App\Models\Attendance;
use App\Models\ClubCategorySession;
use App\Models\Group;
use App\Models\Payment;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Observers\AttendanceObserver;
use App\Observers\ClubCategorySessionObserver;
use App\Observers\GroupObserver;
use App\Observers\PaymentObserver;
use App\Observers\ProgramSessionObserver;
use App\Observers\StudentObserver;
use Barryvdh\Debugbar\Facades\Debugbar;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\AliasLoader;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
            $this->app->register(TelescopeServiceProvider::class);

            $loader = AliasLoader::getInstance();
            $loader->alias('Debugbar', Debugbar::class);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (env('APP_ENV') !== 'local') {
            URL::forceScheme('https');
            $this->app['request']->server->set('HTTPS', 'on');
        }

        Student::observe(StudentObserver::class);
        Group::observe(GroupObserver::class);
        ClubCategorySession::observe(ClubCategorySessionObserver::class);
        Attendance::observe(AttendanceObserver::class);
        ProgramSession::observe(ProgramSessionObserver::class);
        Payment::observe(PaymentObserver::class);

        ResetPassword::toMailUsing(function ($notifiable, string $token): MailMessage {
            $url = url(route('password.reset', [
                'token' => $token,
                'email' => $notifiable->getEmailForPasswordReset(),
            ], false));

            $count = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

            return (new MailMessage)
                ->subject('إعادة تعيين كلمة السر')
                ->view('emails.reset-password', [
                    'notifiable' => $notifiable,
                    'url' => $url,
                    'count' => $count,
                ]);
        });
    }
}
