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
        href: "/dashboard/statistic",
    },
    {
        icon: <LibraryBig />,
        label: "المداومة",
        href: "/dashboard/presence",
    },
    {
        icon: <Banknote />,
        label: "الدفع",
        href: "/dashboard/payment",
    },
    {
        icon: <Backpack />,
        label: "الطلاب",
        href: "/dashboard/student/create",
    },
    {
        icon: <Presentation />,
        label: "المعلمين",
        href: "/dashboard/teachers",
    },
    {
        icon: <NotebookPen />,
        label: "المساعدين",
        href: "/dashboard/assistants",
    },
    {
        icon: <House />,
        label: "النوادي",
        href: "/dashboard/clubs",
    },
    {
        icon: <Users />,
        label: "المشرفين",
        href: "/dashboard/supervisors",
    },
    {
        icon: <Settings />,
        label: "الاعدادات",
        href: "/dashboard/settings",
    },
];
