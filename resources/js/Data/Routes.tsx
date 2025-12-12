import {
    Backpack,
    ChartPie,
    DatabaseBackup,
    House,
    LibraryBig,
    LogOut,
    Network,
    NotebookPen,
    Presentation,
    ScrollText,
    User,
    Users,
} from "lucide-react";

export const sidebarLinks = [
    {
        icon: <ChartPie />,
        label: "الاحصائيات",
        latin: "Statistics",
        display: false,
        crud: false,
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        href: "/statistic",
    },
    {
        icon: <LibraryBig />,
        label: "المداومة",
        latin: "Presence",
        display: true,
        crud: false,
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        href: "/presence",
    },
    {
        icon: <Backpack />,
        label: "الطلاب",
        latin: "Students",
        display: false,
        crud: true,
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        href: "/students",
    },
    {
        icon: <Network />,
        label: "برنامج",
        latin: "Program",
        display: false,
        crud: true,
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        href: "/programs",
    },
    {
        icon: <Presentation />,
        label: "المعلمين",
        latin: "Teachers",
        display: true,
        crud: true,
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        href: "/dashboard/teachers",
    },
    {
        icon: <NotebookPen />,
        label: "المساعدين",
        latin: "Assistants",
        display: true,
        crud: true,
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        href: "/dashboard/assistants",
    },
    {
        icon: <House />,
        label: "النوادي",
        latin: "Clubs",
        display: false,
        crud: true,
        visibleFor: ["admin"],
        href: "/clubs",
    },
    {
        icon: <Users />,
        label: "موارد بشرية",
        latin: "HR",
        display: false,
        crud: true,
        visibleFor: ["admin"],
        href: "/personnels",
    },
];

// Profile menu items - shown in the profile dropdown at the bottom of sidebar
export const profileMenuLinks = [
    {
        icon: <User className="h-4 w-4" />,
        label: "الملف الشخصي",
        latin: "Profile",
        href: "/profile",
        visibleFor: ["admin", "moderator", "staff", "teacher"],
    },
    {
        icon: <ScrollText className="h-4 w-4" />,
        label: "السجلّات",
        latin: "Logs",
        href: "/system/logs",
        visibleFor: ["admin"],
    },
    {
        icon: <DatabaseBackup className="h-4 w-4" />,
        label: "نسخ احتياطي",
        latin: "Backups",
        href: "/system/backup",
        visibleFor: ["admin"],
    },
    {
        icon: <LogOut className="h-4 w-4" />,
        label: "تسجيل الخروج",
        latin: "Logout",
        href: "logout",
        visibleFor: ["admin", "moderator", "staff", "teacher"],
        isLogout: true,
    },
];

export const breadcrumbLinks = [
    {
        label: "تسجيل",
        action: "create",
    },
    {
        label: "تعديل",
        action: "edit",
    },
    {
        label: "دفع",
        action: "payment",
    },
    {
        label: "عرض",
        action: "",
    },
];
