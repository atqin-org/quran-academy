import {
    Backpack,
    Banknote,
    ChartPie,
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
        icon: <Banknote />,
        label: "الدفع",
        latin: "Payment",
        crud: false,
        href: "/dashboard/payment",
    },
    {
        icon: <Backpack />,
        label: "الطلاب",
        latin: "Students",
        crud: true,
        href: "/dashboard/students",
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
        label: "المشرفين",
        latin: "Supervisors",
        crud: true,
        href: "/dashboard/supervisors",
    },
    {
        icon: <Settings />,
        label: "الاعدادات",
        latin: "Settings",
        crud: false,
        href: "/dashboard/settings",
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
        label: "عرض",
        action: "",
    },
];
