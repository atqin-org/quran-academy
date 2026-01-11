import { Button } from "@/Components/ui/button";
import { sidebarLinks } from "@/Data/Routes";
import { cn } from "@/lib/utils";
import { PanelRight } from "lucide-react";
import React, { useEffect, useState } from "react";
import { TooltipProvider } from "../ui/tooltip";
import SidebarLink from "./SidebarLink ";
import { TUser } from "@/types";
import ProfileMenu from "./ProfileMenu";

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
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        setTooltipKey((prevKey) => prevKey + 1);
    }, [isCollapsed]);

    const currentUrl = String(window.location.pathname);

    // Ensure isCollapsed is false when mobile is true
    const effectiveIsCollapsed = mobile ? false : isCollapsed;

    return (
        <aside
            className={cn(`transition-width duration-300 z-10 `, {
                "w-28": effectiveIsCollapsed,
                "w-52": !effectiveIsCollapsed,
                "flex justify-center h-96 w-full": mobile,
                "hidden h-[100svh] md:flex": !mobile,
            })}
        >
            <nav
                className={cn(
                    `flex flex-col items-center rounded-xl justify-between gap-2 md:gap-4 lg:gap-8 px-2 py-2 overflow-hidden`,
                    {
                        "bg-background bg-zinc-50 border-2 border-gray-100 my-5 ms-3":
                            !mobile,
                        "w-full m-1": mobile,
                    }
                )}
            >
                {/* Logo and Collapse Toggle */}
                {!mobile && effectiveIsCollapsed && (
                    <div
                        className="w-full flex justify-center py-1 cursor-pointer relative"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={toggleSidebar}
                    >
                        <img
                            src="/images/athar-logo.svg"
                            alt="Athar Logo"
                            className={cn(
                                "w-12 h-12 transition-opacity duration-200",
                                {
                                    "opacity-0": isHovered,
                                    "opacity-100": !isHovered,
                                }
                            )}
                        />
                        <PanelRight
                            className={cn(
                                "w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200",
                                {
                                    "opacity-100": isHovered,
                                    "opacity-0": !isHovered,
                                }
                            )}
                        />
                    </div>
                )}
                {!mobile && !effectiveIsCollapsed && (
                    <div className="w-full flex flex-row items-center justify-between px-2">
                        <img
                            src="/images/athar-logo.svg"
                            alt="Athar Logo"
                            className="w-12 h-12 flex-shrink-0"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleSidebar}
                        >
                            <PanelRight className="w-5 h-5" />
                        </Button>
                    </div>
                )}

                <div className="flex flex-col items-start gap-3 flex-1 w-full px-4 py-1 overflow-y-auto overflow-x-hidden scrollbar-wraper">
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
                                    isSelected={currentUrl === link.href || (currentUrl.startsWith(link.href + "/"))}
                                />
                            ))}
                    </TooltipProvider>
                </div>
                <div className="flex flex-col items-center gap-4 w-full">
                    <ProfileMenu
                        auth={auth}
                        isCollapsed={effectiveIsCollapsed}
                        mobile={mobile}
                    />
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
