import { Link, router, usePage } from "@inertiajs/react";
import { AlertTriangle, Bell, CalendarClock, Check, CreditCard, UserCheck, X } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { AppNotification, CapacityOverflow, PageProps } from "@/types";

const CAPACITY_TYPE = "class_over_capacity";
const SESSION_ATTENDANCE_TYPE = "session_attendance_pending";
const PAYMENT_OVERDUE_TYPE = "payment_overdue";
const PERSONNEL_INVITE_ACCEPTED_TYPE = "personnel_invite_accepted";

export default function NotificationBell() {
    const { notifications } = usePage<PageProps>().props;
    const unread = notifications?.unread ?? [];
    const count = notifications?.unread_count ?? 0;

    const hasDismissableUnread = unread.some((n) => n.dismissable);

    const handleMarkAllRead = () => {
        router.post(
            route("notifications.readAll"),
            {},
            { preserveScroll: true }
        );
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className="relative text-primary hover:text-primary/70 transition-colors flex items-center justify-center flex-shrink-0"
                    title={`${count} تنبيه`}
                >
                    <Bell className="h-7 w-7" />
                    {count > 0 && (
                        <span className="absolute -top-1 -end-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white border-2 border-white">
                            {count}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                dir="rtl"
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-80 p-0"
            >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                    <span className="text-sm font-semibold text-gray-900">
                        التنبيهات ({count})
                    </span>
                    {hasDismissableUnread && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-primary hover:underline"
                        >
                            تحديد الكل كمقروء
                        </button>
                    )}
                </div>
                {unread.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500">
                        لا توجد تنبيهات جديدة
                    </p>
                ) : (
                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {unread.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                            />
                        ))}
                    </ul>
                )}
                <div className="border-t border-gray-100 px-4 py-2 text-center">
                    <Link
                        href={route("notifications.index")}
                        className="text-sm text-primary hover:underline"
                    >
                        عرض الكل
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function MarkReadButton({ id }: { id: string }) {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.post(route("notifications.read", id), {}, { preserveScroll: true });
    };

    return (
        <button
            onClick={handleClick}
            className="text-gray-400 hover:text-green-600"
            title="تحديد كمقروء"
        >
            <Check className="h-4 w-4" />
        </button>
    );
}

function NotificationItem({ notification }: { notification: AppNotification }) {
    if (notification.type === CAPACITY_TYPE) {
        return <CapacityNotificationRow notification={notification} />;
    }

    if (notification.type === SESSION_ATTENDANCE_TYPE) {
        return <SessionAttendanceRow notification={notification} />;
    }

    if (notification.type === PAYMENT_OVERDUE_TYPE) {
        return <PaymentOverdueRow notification={notification} />;
    }

    if (notification.type === PERSONNEL_INVITE_ACCEPTED_TYPE) {
        return <PersonnelInviteAcceptedRow notification={notification} />;
    }

    return <GenericNotificationRow notification={notification} />;
}

function PersonnelInviteAcceptedRow({ notification }: { notification: AppNotification }) {
    const data = notification.data as Record<string, unknown>;
    const name = (data.personnel_name as string) ?? "";
    const email = (data.personnel_email as string) ?? "";

    return (
        <li className="flex items-start gap-1 px-4 py-3 hover:bg-gray-50">
            <Link href={route("personnels.index")} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mb-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    قَبِل الدعوة
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                    {name || "موظف جديد"}
                </p>
                {email && (
                    <p className="text-xs text-gray-500 truncate" dir="ltr">
                        {email}
                    </p>
                )}
            </Link>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {notification.dismissable && <MarkReadButton id={notification.id} />}
            </div>
        </li>
    );
}

function SessionAttendanceRow({ notification }: { notification: AppNotification }) {
    const data = notification.data as Record<string, unknown>;
    const programName = (data.program_name as string) ?? "";
    const clubName = (data.club_name as string) ?? "";
    const categoryName = (data.category_name as string) ?? "";
    const sessionDate = (data.session_date as string) ?? "";
    const manageUrl = (data.manage_url as string) ?? "#";

    const subtitle = [clubName, categoryName].filter(Boolean).join(" · ");

    return (
        <li className="flex items-start gap-1 px-4 py-3 hover:bg-gray-50">
            <Link href={manageUrl} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mb-1">
                    <CalendarClock className="h-3.5 w-3.5" />
                    حضور غير مسجّل
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                    {programName || subtitle}
                </p>
                {subtitle && programName && (
                    <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                )}
            </Link>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {sessionDate}
                </span>
                {notification.dismissable && <MarkReadButton id={notification.id} />}
            </div>
        </li>
    );
}

function PaymentOverdueRow({ notification }: { notification: AppNotification }) {
    const data = notification.data as Record<string, unknown>;
    const studentName = (data.student_name as string) ?? "";
    const clubName = (data.club_name as string) ?? "";
    const categoryName = (data.category_name as string) ?? "";
    const credit = (data.sessions_credit as number) ?? 0;
    const manageUrl = (data.manage_url as string) ?? "#";
    const subtitle = [clubName, categoryName].filter(Boolean).join(" · ");

    return (
        <li className="flex items-start gap-1 px-4 py-3 hover:bg-gray-50">
            <Link href={manageUrl} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mb-1">
                    <CreditCard className="h-3.5 w-3.5" />
                    دفع متأخر
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                    {studentName}
                </p>
                {subtitle && (
                    <p className="text-xs text-gray-500 truncate">{subtitle}</p>
                )}
            </Link>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-sm font-semibold text-red-600 whitespace-nowrap">
                    {credit}
                </span>
                {notification.dismissable && <MarkReadButton id={notification.id} />}
            </div>
        </li>
    );
}

function CapacityNotificationRow({ notification }: { notification: AppNotification }) {
    const data = notification.data as unknown as CapacityOverflow;
    const title =
        data.kind === "group"
            ? `${data.club_name} · ${data.category_name} · فوج ${data.group_name}`
            : `${data.club_name} · ${data.category_name}`;

    return (
        <li className="flex items-start gap-1 px-4 py-3 hover:bg-gray-50">
            <Link href={data.manage_url} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-semibold mb-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    تجاوز السعة
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">
                    {title}
                </p>
            </Link>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="text-sm font-semibold text-red-600 whitespace-nowrap">
                    {data.current} / {data.capacity}
                </span>
                {notification.dismissable && <MarkReadButton id={notification.id} />}
            </div>
        </li>
    );
}

function GenericNotificationRow({ notification }: { notification: AppNotification }) {
    const data = notification.data as Record<string, unknown>;
    const title = (data.title as string) ?? "تنبيه";
    const message = (data.message as string) ?? "";
    const url = (data.url as string) ?? "";

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        router.delete(route("notifications.destroy", notification.id), {
            preserveScroll: true,
        });
    };

    const Body = (
        <div className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{title}</p>
                {message && (
                    <p className="text-xs text-gray-500 mt-0.5">{message}</p>
                )}
            </div>
            {notification.dismissable && (
                <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600"
                    title="إخفاء"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );

    return <li>{url ? <Link href={url}>{Body}</Link> : Body}</li>;
}
