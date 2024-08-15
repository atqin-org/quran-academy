import { useState, PropsWithChildren, ReactNode } from "react";
import { TUser } from "@/types";
import Sidebar from "@/Components/costume-cn/Sidebar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTrigger,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Menu } from "lucide-react";
import { Slash } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/Components/ui/breadcrumb";
import { Toaster } from "@/Components/ui/sonner";
import { sidebarLinks } from "@/data/routes";
import { breadcrumbLinks } from "@/data/routes";

export default function DashboardLayout({
    user,
    children,
}: PropsWithChildren<{ user: TUser }>) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };
    const currentUrl = String(window.location.pathname);
    const sidebarLinkObj = sidebarLinks.find((link) =>
        currentUrl.includes(link.href)
    );
    const breadcrumbLinkObj = breadcrumbLinks.find((link) =>
        currentUrl.includes(link.action)
    );
    return (
        <div className="h-[100svh] overflow-y-hidden bg-[url('/background.jpg')] bg-cover bg-center flex w-full">
            <Toaster position="bottom-left" theme="light" richColors />

            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            <div className="flex flex-col overflow-y-scroll scrollbar-wraper flex-1 w-full my-5 mx-5 sm:ms-0 p-2 sm:px-6 lg:px-8 bg-background bg-zinc-50 border-2 border-gray-100 rounded-xl">
                <Sheet>
                    <SheetTrigger className="sm:hidden" asChild>
                        <Button variant="outline">
                            <Menu /> التصفح
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom">
                        <SheetHeader>
                            <SheetDescription className="flex-col justify-center items-center w-full">
                                <Sidebar
                                    mobile={true}
                                    isCollapsed={isCollapsed}
                                    toggleSidebar={toggleSidebar}
                                />
                            </SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
                <Breadcrumb className="my-2">
                    <BreadcrumbList>
                        {sidebarLinkObj && (
                            <BreadcrumbItem>
                                <BreadcrumbLink href={sidebarLinkObj.href}>
                                    {sidebarLinkObj.label}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        )}

                        <BreadcrumbItem>
                            {breadcrumbLinkObj && sidebarLinkObj && (sidebarLinkObj.crud===true) ?(
                                <>
                                    <BreadcrumbSeparator>
                                        <Slash />
                                    </BreadcrumbSeparator>
                                    <BreadcrumbLink
                                        href={breadcrumbLinkObj.action}
                                    >
                                        {breadcrumbLinkObj.label}{" "}
                                        {sidebarLinkObj.label}
                                    </BreadcrumbLink>
                                </>
                            ):(<></>)}
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <main className="mt-4 flex-grow">{children}</main>
            </div>
        </div>
    );
}
