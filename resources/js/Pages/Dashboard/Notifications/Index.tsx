import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, InfiniteScroll, Link, router } from "@inertiajs/react";
import {
    Card,
    CardContent,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { AlertTriangle, Bell, CalendarClock, Check, CreditCard, Settings2, UserCheck, X } from "lucide-react";
import { AppNotification, CapacityOverflow, TUser } from "@/types";

const CAPACITY_TYPE = "class_over_capacity";
const SESSION_ATTENDANCE_TYPE = "session_attendance_pending";
const PAYMENT_OVERDUE_TYPE = "payment_overdue";
const PERSONNEL_INVITE_ACCEPTED_TYPE = "personnel_invite_accepted";

interface PaginatedNotifications {
    data: AppNotification[];
    total: number;
}

interface NotificationsIndexProps {
    auth: { user: TUser };
    notifications: PaginatedNotifications;
    filter: "unread" | "all";
}

export default function Index({
    auth,
    notifications,
    filter,
}: NotificationsIndexProps) {
    const items = notifications.data;
    const hasDismissableUnread = items.some(
        (n) => n.dismissable && !n.read_at
    );

    const setFilter = (next: "unread" | "all") => {
        router.get(
            route("notifications.index"),
            { filter: next },
            { preserveScroll: true, preserveState: true }
        );
    };

    const markAllRead = () => {
        router.post(
            route("notifications.readAll"),
            {},
            { preserveScroll: true }
        );
    };

    const markRead = (id: string) => {
        router.post(
            route("notifications.read", id),
            {},
            { preserveScroll: true }
        );
    };

    const dismiss = (id: string) => {
        router.delete(route("notifications.destroy", id), {
            preserveScroll: true,
        });
    };

    return (
        <DashboardLayout user={auth.user}>
            <Head title="التنبيهات" />
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <h1 className="text-2xl font-bold text-gray-900">
                            التنبيهات
                        </h1>
                        <Badge variant="secondary">{notifications.total}</Badge>
                    </div>
                    <Link href={route("profile.edit")}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            إعدادات التنبيهات
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                        <Button
                            variant={filter === "unread" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("unread")}
                        >
                            غير مقروءة
                        </Button>
                        <Button
                            variant={filter === "all" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter("all")}
                        >
                            الكل
                        </Button>
                    </div>
                    {hasDismissableUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllRead}
                        >
                            تحديد الكل كمقروء
                        </Button>
                    )}
                </div>

                {items.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-gray-500">
                            لا توجد تنبيهات
                        </CardContent>
                    </Card>
                ) : (
                    <InfiniteScroll
                        data="notifications"
                        preserveUrl
                        loading={() => (
                            <div className="flex items-center justify-center py-3">
                                <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <span className="ms-2 text-xs text-muted-foreground">
                                    جاري التحميل...
                                </span>
                            </div>
                        )}
                    >
                        <div className="flex flex-col gap-2">
                            {items.map((notification) => (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    onMarkRead={markRead}
                                    onDismiss={dismiss}
                                />
                            ))}
                        </div>
                    </InfiniteScroll>
                )}
            </div>
        </DashboardLayout>
    );
}

function NotificationCard({
    notification,
    onMarkRead,
    onDismiss,
}: {
    notification: AppNotification;
    onMarkRead: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    const isUnread = !notification.read_at;

    if (notification.type === CAPACITY_TYPE) {
        const data = notification.data as unknown as CapacityOverflow;
        const title =
            data.kind === "group"
                ? `${data.club_name} · ${data.category_name} · فوج ${data.group_name}`
                : `${data.club_name} · ${data.category_name}`;

        return (
            <Card
                className={isUnread ? "border-red-300" : "border-gray-200"}
            >
                <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-600">
                                تجاوز السعة
                            </span>
                            <Badge
                                variant={isUnread ? "destructive" : "outline"}
                            >
                                {isUnread ? "نشطة" : "تم الحل"}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {title}
                        </p>
                        <p className="text-sm text-red-600 mt-0.5">
                            {data.current} / {data.capacity} طالب
                        </p>
                        {notification.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString("ar")}
                            </p>
                        )}
                    </div>
                    <RowActions
                        notification={notification}
                        manageUrl={data.manage_url}
                        manageLabel="إدارة"
                        onMarkRead={onMarkRead}
                        onDismiss={onDismiss}
                    />
                </CardContent>
            </Card>
        );
    }

    if (notification.type === SESSION_ATTENDANCE_TYPE) {
        const data = notification.data as Record<string, unknown>;
        const programName = (data.program_name as string) ?? "";
        const clubName = (data.club_name as string) ?? "";
        const categoryName = (data.category_name as string) ?? "";
        const sessionDate = (data.session_date as string) ?? "";
        const startTime = (data.start_time as string) ?? "";
        const manageUrl = (data.manage_url as string) ?? "#";
        const subtitle = [clubName, categoryName].filter(Boolean).join(" · ");

        return (
            <Card className={isUnread ? "border-amber-300" : "border-gray-200"}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <CalendarClock className="h-4 w-4 text-amber-700" />
                            <span className="text-sm font-semibold text-amber-700">
                                حضور غير مسجّل
                            </span>
                            <Badge variant={isUnread ? "destructive" : "outline"}>
                                {isUnread ? "نشطة" : "تم الحل"}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {programName}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                            {sessionDate}
                            {startTime ? ` — ${startTime}` : ""}
                        </p>
                        {notification.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString("ar")}
                            </p>
                        )}
                    </div>
                    <RowActions
                        notification={notification}
                        manageUrl={manageUrl}
                        manageLabel="تسجيل الحضور"
                        onMarkRead={onMarkRead}
                        onDismiss={onDismiss}
                    />
                </CardContent>
            </Card>
        );
    }

    if (notification.type === PERSONNEL_INVITE_ACCEPTED_TYPE) {
        const data = notification.data as Record<string, unknown>;
        const name = (data.personnel_name as string) ?? "موظف جديد";
        const email = (data.personnel_email as string) ?? "";

        return (
            <Card className={isUnread ? "border-emerald-300" : "border-gray-200"}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <UserCheck className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-emerald-700">
                                قَبِل الدعوة
                            </span>
                            <Badge variant={isUnread ? "default" : "outline"}>
                                {isUnread ? "غير مقروءة" : "مقروءة"}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {name}
                        </p>
                        {email && (
                            <p className="text-xs text-gray-500 mt-0.5" dir="ltr">
                                {email}
                            </p>
                        )}
                        {notification.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString("ar")}
                            </p>
                        )}
                    </div>
                    <RowActions
                        notification={notification}
                        manageUrl={route("personnels.index")}
                        manageLabel="عرض الموظفين"
                        onMarkRead={onMarkRead}
                        onDismiss={onDismiss}
                    />
                </CardContent>
            </Card>
        );
    }

    if (notification.type === PAYMENT_OVERDUE_TYPE) {
        const data = notification.data as Record<string, unknown>;
        const studentName = (data.student_name as string) ?? "";
        const clubName = (data.club_name as string) ?? "";
        const categoryName = (data.category_name as string) ?? "";
        const credit = (data.sessions_credit as number) ?? 0;
        const manageUrl = (data.manage_url as string) ?? "#";
        const subtitle = [clubName, categoryName].filter(Boolean).join(" · ");

        return (
            <Card className={isUnread ? "border-red-300" : "border-gray-200"}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <CreditCard className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-600">
                                دفع متأخر
                            </span>
                            <Badge variant={isUnread ? "destructive" : "outline"}>
                                {isUnread ? "نشطة" : "تم الحل"}
                            </Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                            {studentName}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
                        )}
                        <p className="text-sm text-red-600 mt-1">
                            الرصيد: {credit}
                        </p>
                        {notification.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.created_at).toLocaleString("ar")}
                            </p>
                        )}
                    </div>
                    <RowActions
                        notification={notification}
                        manageUrl={manageUrl}
                        manageLabel="إدارة الدفع"
                        onMarkRead={onMarkRead}
                        onDismiss={onDismiss}
                    />
                </CardContent>
            </Card>
        );
    }

    const data = notification.data as Record<string, unknown>;
    const title = (data.title as string) ?? "تنبيه";
    const message = (data.message as string) ?? "";
    const url = (data.url as string) ?? "";

    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                            {title}
                        </span>
                        <Badge variant="outline">
                            {isUnread ? "غير مقروءة" : "مقروءة"}
                        </Badge>
                    </div>
                    {message && (
                        <p className="text-sm text-gray-500">{message}</p>
                    )}
                    {notification.created_at && (
                        <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString("ar")}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {url && (
                        <Link href={url}>
                            <Button variant="outline" size="sm">
                                فتح
                            </Button>
                        </Link>
                    )}
                    {notification.dismissable && isUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkRead(notification.id)}
                        >
                            تحديد كمقروءة
                        </Button>
                    )}
                    {notification.dismissable && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onDismiss(notification.id)}
                            title="إخفاء"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function RowActions({
    notification,
    manageUrl,
    manageLabel,
    onMarkRead,
    onDismiss,
}: {
    notification: AppNotification;
    manageUrl: string;
    manageLabel: string;
    onMarkRead: (id: string) => void;
    onDismiss: (id: string) => void;
}) {
    const isUnread = !notification.read_at;

    return (
        <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={manageUrl}>
                <Button variant="outline" size="sm">
                    {manageLabel}
                </Button>
            </Link>
            {notification.dismissable && isUnread && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={() => onMarkRead(notification.id)}
                    title="تحديد كمقروء"
                >
                    <Check className="h-4 w-4" />
                </Button>
            )}
            {notification.dismissable && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onDismiss(notification.id)}
                    title="إخفاء"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
