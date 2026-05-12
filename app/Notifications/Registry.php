<?php

namespace App\Notifications;

use App\Models\NotificationTypeSetting;

class Registry
{
    public const CLASS_OVER_CAPACITY = 'class_over_capacity';

    public const SESSION_ATTENDANCE_PENDING = 'session_attendance_pending';

    public const PAYMENT_OVERDUE = 'payment_overdue';

    /**
     * All known notification types with display metadata.
     *
     * `default_dismissable` is the fallback value used when no admin-set
     * row exists in `notification_type_settings`. Targeted-state notifications
     * (capacity overflow, missing attendance, overdue payment) default to
     * non-dismissable because they should only clear when the underlying
     * condition is resolved.
     *
     * @return array<string, array{label: string, description: string, allow_email: bool, allow_push: bool, default_dismissable: bool}>
     */
    public static function all(): array
    {
        return [
            self::CLASS_OVER_CAPACITY => [
                'label' => 'تجاوز السعة الاستيعابية',
                'description' => 'تنبيه عند تجاوز عدد طلاب الفصل أو الفوج للسعة المحددة',
                'allow_email' => true,
                'allow_push' => true,
                'default_dismissable' => false,
            ],
            self::SESSION_ATTENDANCE_PENDING => [
                'label' => 'حضور غير مسجّل',
                'description' => 'تنبيه عند مرور 24 ساعة على جلسة دون تسجيل الحضور',
                'allow_email' => true,
                'allow_push' => true,
                'default_dismissable' => false,
            ],
            self::PAYMENT_OVERDUE => [
                'label' => 'دفع متأخر',
                'description' => 'تنبيه عند تأخر الطالب في الدفع (رصيد سالب)',
                'allow_email' => true,
                'allow_push' => true,
                'default_dismissable' => false,
            ],
        ];
    }

    public static function types(): array
    {
        return array_keys(self::all());
    }

    public static function get(string $type): ?array
    {
        return self::all()[$type] ?? null;
    }

    /**
     * Effective dismissable flag for a type — admin-set row wins; otherwise
     * the registry default. Unknown (third-party/generic) types default to
     * dismissable since they're outside this app's targeted-state model.
     */
    public static function isDismissable(string $type): bool
    {
        $row = NotificationTypeSetting::query()->where('type', $type)->first();
        if ($row) {
            return (bool) $row->dismissable;
        }

        $meta = self::get($type);
        if ($meta === null) {
            return true;
        }

        return (bool) ($meta['default_dismissable'] ?? false);
    }

    /**
     * Bulk dismissable map for the registered types only.
     *
     * @return array<string, bool>
     */
    public static function dismissableMap(): array
    {
        $rows = NotificationTypeSetting::query()->pluck('dismissable', 'type')->all();
        $result = [];
        foreach (self::all() as $type => $meta) {
            $result[$type] = array_key_exists($type, $rows)
                ? (bool) $rows[$type]
                : (bool) ($meta['default_dismissable'] ?? false);
        }

        return $result;
    }
}
