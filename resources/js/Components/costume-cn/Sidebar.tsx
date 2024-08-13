import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    Backpack,
    Banknote,
    ChartPie,
    ChevronsLeft,
    ChevronsRight,
    House,
    LibraryBig,
    LogOut,
    NotebookPen,
    Presentation,
    Settings,
    User,
    Users,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import {
    TooltipProvider,
} from "../ui/tooltip";
import SidebarLink from "./SidebarLink ";
interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    mobile?: boolean;
}

const sidebarLinks = [
    {
        icon: <ChartPie />,
        label: "الاحصائيات",
        href: "#statistic",
        isSelected: false,
    },
    {
        icon: <LibraryBig />,
        label: "المداومة",
        href: "#presence",
        isSelected: false,
    },
    {
        icon: <Banknote />,
        label: "الدفع",
        href: "#payment",
        isSelected: false,
    },
    {
        icon: <Backpack />,
        label: "الطلاب",
        href: "#students",
        isSelected: true,
    },
    {
        icon: <Presentation />,
        label: "المعلمين",
        href: "#teachers",
        isSelected: false,
    },
    {
        icon: <NotebookPen />,
        label: "المساعدين",
        href: "#assistants",
        isSelected: false,
    },
    {
        icon: <House />,
        label: "النوادي",
        href: "#clubs",
        isSelected: false,
    },
    {
        icon: <Users />,
        label: "المشرفين",
        href: "#supervisors",
        isSelected: false,
    },
    {
        icon: <Settings />,
        label: "الاعدادات",
        href: "#settings",
        isSelected: false,
    },
];

const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    toggleSidebar,
    mobile,
}) => {
    const [tooltipKey, setTooltipKey] = useState(0);

    useEffect(() => {
        setTooltipKey((prevKey) => prevKey + 1);
    }, [isCollapsed]);

    return (
        <aside
            className={cn(`transition-width duration-300 z-10 `, {
                "w-36": isCollapsed,
                "w-60": !isCollapsed,
                "flex justify-center h-96 w-full": mobile,
                "hidden h-screen sm:flex": !mobile,
            })}
        >
            <nav
                className={cn(
                    `flex flex-col items-center rounded-xl justify-between gap-2 md:gap-8 px-2 py-1 sm:py-5 overflow-hidden`,
                    {
                        "bg-background bg-zinc-50 border-2 border-gray-100 m-5":
                            !mobile,
                        "w-full m-1": mobile,
                    }
                )}
            >
                <div className="border-2 border-primary w-full px-0.5 py-2 text-center rounded-md flex gap-2 items-center justify-center text-nowrap">
                    {!isCollapsed && <User />}
                    {!isCollapsed && "المشرف العام"}
                    <Button
                        variant="ghost"
                        className="p-2"
                        onClick={toggleSidebar}
                    >
                        {isCollapsed ? <ChevronsLeft /> : <ChevronsRight />}
                    </Button>
                </div>

                <div className="flex flex-col items-start gap-4 flex-1 w-full px-4 py-1 overflow-y-scroll">
                    <TooltipProvider key={tooltipKey}>
                        {sidebarLinks.map((link, index) => (
                            <SidebarLink
                                className={mobile ? `justify-center` : ``}
                                key={index}
                                href={link.href}
                                icon={link.icon}
                                label={link.label}
                                isCollapsed={isCollapsed}
                                isSelected={link.isSelected}
                            />
                        ))}
                    </TooltipProvider>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    <Button className="flex gap-2 rounded-md w-full">
                        <LogOut />
                        {!isCollapsed && "تسجيل الخروج"}
                    </Button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
