import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronsLeft,
    ChevronsRight,
    LogOut,
    User,
} from "lucide-react";
import { Button } from "@/Components/ui/button";
import { TooltipProvider } from "../ui/tooltip";
import SidebarLink from "./SidebarLink ";
import { sidebarLinks } from "@/data/routes";
interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    isCollapsed,
    toggleSidebar,
    mobile,
}) => {
    const [tooltipKey, setTooltipKey] = useState(0);

    useEffect(() => {
        setTooltipKey((prevKey) => prevKey + 1);
    }, [isCollapsed]);

    const currentUrl = String(window.location.pathname);

    // Ensure isCollapsed is false when mobile is true
    const effectiveIsCollapsed = mobile ? false : isCollapsed;

    return (
        <aside
            className={cn(`transition-width duration-300 z-10 `, {
                "w-36": effectiveIsCollapsed,
                "w-60": !effectiveIsCollapsed,
                "flex justify-center h-96 w-full": mobile,
                "hidden h-[100svh] sm:flex": !mobile,
            })}
        >
            <nav
                className={cn(
                    `flex flex-col items-center rounded-xl justify-between gap-2 sm:gap-4 lg:gap-8 px-2 sm:py-2 overflow-hidden`,
                    {
                        "bg-background bg-zinc-50 border-2 border-gray-100 m-5":
                            !mobile,
                        "w-full m-1": mobile,
                    }
                )}
            >
                <div className="border-2 border-primary w-full px-0.5 py-2 text-center rounded-md flex gap-2 items-center justify-center text-nowrap">
                    {!effectiveIsCollapsed && <User />}
                    {!effectiveIsCollapsed && "المشرف العام"}
                    {!mobile && (
                        <Button
                            variant="ghost"
                            className="p-2"
                            onClick={toggleSidebar}
                        >
                            {effectiveIsCollapsed ? (
                                <ChevronsLeft />
                            ) : (
                                <ChevronsRight />
                            )}
                        </Button>
                    )}
                </div>

                <div className="flex flex-col items-start gap-4 flex-1 w-full px-4 py-1 overflow-y-scroll scrollbar-wraper">
                    <TooltipProvider key={tooltipKey}>
                        {sidebarLinks.map((link, index) => (
                            <SidebarLink
                                className={mobile ? `justify-center` : ``}
                                key={index}
                                href={link.href}
                                icon={link.icon}
                                label={link.label}
                                isCollapsed={effectiveIsCollapsed}
                                isSelected={currentUrl.includes(link.href)}
                            />
                        ))}
                    </TooltipProvider>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    <Button
                        className="flex gap-2 rounded-md w-full"
                        onClick={() => {
                            console.log(currentUrl);
                        }}
                    >
                        <LogOut />
                        {!effectiveIsCollapsed && "تسجيل الخروج"}
                    </Button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
