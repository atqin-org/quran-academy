import { Button } from "@/Components/ui/button";
import { sidebarLinks } from "@/Data/Routes";
import { cn } from "@/lib/utils";
import { ChevronsLeft, ChevronsRight, LogOut, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { TooltipProvider } from "../ui/tooltip";
import SidebarLink from "./SidebarLink ";
import { Link } from "@inertiajs/react";
import { TUser } from "@/types";

interface SidebarProps {
    auth: TUser;
    isCollapsed: boolean;
    toggleSidebar: () => void;
    mobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
    auth,
    isCollapsed,
    toggleSidebar,
    mobile,
}) => {
    const [tooltipKey, setTooltipKey] = useState(0);
    const translateRole = (role: string) => {
        switch (role) {
            case "admin":
                return "مشرف عام";
            case "moderator":
                return "مدير";
            case "staff":
                return "مشرف";
            case "teacher":
                return "معلم";
            default:
                return role;
        }
    };
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
                "hidden h-[100svh] md:flex": !mobile,
            })}
        >
            <nav
                className={cn(
                    `flex flex-col items-center rounded-xl justify-between gap-2 md:gap-4 lg:gap-8 px-2 py-2 overflow-hidden`,
                    {
                        "bg-background bg-zinc-50 border-2 border-gray-100 m-5":
                            !mobile,
                        "w-full m-1": mobile,
                    }
                )}
            >
                <div className="border-2 border-primary w-full px-0.5 py-2 text-center rounded-md flex gap-2 items-center justify-center text-nowrap">
                    {!effectiveIsCollapsed && (
                        <User className="flex-shrink-0" />
                    )}
                    {!effectiveIsCollapsed && (
                        <div className="flex flex-col items-start text-sm">
                            <span
                                className={`truncate font-semibold text-start ${
                                    mobile ? "" : "w-24"
                                }`}
                            >
                                {auth.name} {auth.last_name}
                            </span>
                            <span className="truncate ">
                                {translateRole(auth.role)}
                            </span>
                        </div>
                    )}
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

                <div className="flex flex-col items-start gap-3 flex-1 w-full px-4 py-1 overflow-y-scroll overflow-x-hidden scrollbar-wraper">
                    <TooltipProvider key={tooltipKey}>
                        {sidebarLinks
                            .filter(
                                (link) =>
                                    !link.display &&
                                    (!link.visibleFor ||
                                        link.visibleFor.includes(auth.role))
                            )
                            .map((link, index) => (
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
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="bg-primary hover:bg-primary/90 py-3 text-white flex justify-center gap-2 rounded-md w-full"
                    >
                        <LogOut />
                        {!effectiveIsCollapsed && "تسجيل الخروج"}
                    </Link>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
