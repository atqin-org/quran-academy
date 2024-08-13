import { useState, PropsWithChildren, ReactNode } from "react";
import { TUser } from "@/types";
import Sidebar from "@/Components/costume-cn/Sidebar";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/Components/ui/sheet";
import { Button } from "@/Components/ui/button";
import { Menu } from "lucide-react";

export default function DashboardLayout({
    user,
    children,
}: PropsWithChildren<{ user: TUser }>) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };
    return (
        <div className="h-screen overflow-y-hidden bg-[url('/background.jpg')] bg-cover bg-center flex w-full">
            <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

            <div className="flex-1 w-full my-5 mx-5 sm:ms-0 p-2 bg-background bg-zinc-50 border-2 border-gray-100 rounded-xl">
                <Sheet>
                    <SheetTrigger className="sm:hidden">
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

                <main className="p-2">{children}</main>
            </div>
        </div>
    );
}
