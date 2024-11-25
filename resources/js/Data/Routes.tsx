import {
    Backpack,
    Banknote,
    ChartPie,
    DatabaseBackup,
    House,
    LibraryBig,
    NotebookPen,
    Presentation,
    Settings,
    Users,
} from "lucide-react";
export const sidebarLinks = [
    {
        icon: <ChartPie />,
        label: "الاحصائيات",
        latin: "Statistics",
        crud: false,
        href: "/dashboard/statistic",
    },
    {
        icon: <LibraryBig />,
        label: "المداومة",
        latin: "Presence",
        crud: false,
        href: "/dashboard/presence",
    },
    {
        icon: <Backpack />,
        label: "الطلاب",
        latin: "Students",
        crud: true,
        visibleFor: ["admin", "staff"],
        href: "/students",
    },
    {
        icon: <Presentation />,
        label: "المعلمين",
        latin: "Teachers",
        crud: true,
        href: "/dashboard/teachers",
    },
    {
        icon: <NotebookPen />,
        label: "المساعدين",
        latin: "Assistants",
        crud: true,
        href: "/dashboard/assistants",
    },
    {
        icon: <House />,
        label: "النوادي",
        latin: "Clubs",
        crud: true,
        href: "/dashboard/clubs",
    },
    {
        icon: <Users />,
        label: "الموارد البشرية",
        latin: "HR",
        crud: true,
        href: "/personnels/create",
    },
    {
        icon: <Settings />,
        label: "الاعدادات",
        latin: "Settings",
        crud: false,
        href: "/dashboard/settings",
    },
    {
        icon: <DatabaseBackup />,
        label: "نسخ احتياطي",
        latin: "Backups",
        crud: false,
        visibleFor: ["admin"],
        href: "/system",
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
