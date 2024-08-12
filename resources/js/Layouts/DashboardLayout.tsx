import { useState, PropsWithChildren, ReactNode } from "react";
import { TUser } from "@/types";
import { AccountSwitcher } from "@/Components/costume-cn/account-switcher";
import {
    Backpack,
    Banknote,
    ChartPie,
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
import { Link } from "@inertiajs/react";

export default function DashboardLayout({
    user,
    children,
}: PropsWithChildren<{ user: TUser }>) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className="h-screen overflow-y-hidden bg-custom-image bg-cover flex w-full"
            dir="rtl"
        >
            <aside className="inset-y-0 left-0 z-10 hidden h-screen flex-col sm:flex">
                <nav className="flex flex-col items-center h-full m-5 rounded-xl justify-between gap-2 md:gap-10 px-2 sm:py-5 bg-background bg-zinc-50 border-2 border-gray-100 overflow-hidden">
                    <div className="border-2 border-primary w-full px-0.5 py-2 text-center rounded-md flex gap-2 items-center text-nowrap">
                        <User />
                        المشرف العام
                        <Button
                            variant="ghost"
                            className="p-2"
                            onClick={() => setCollapsed(!collapsed)}
                        >
                            <ChevronsRight />
                        </Button>
                    </div>
                    {/* space */}
                    <div  className="flex flex-col items-start gap-4 flex-1 w-full px-4 overflow-y-scroll">
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <ChartPie />
                            الاحصائيات
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <LibraryBig />
                            المداومة
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <Banknote />
                            الدفع
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <Backpack />
                            الطلاب
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <Presentation />
                            المعلمين
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <NotebookPen />
                            المساعدين
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <House />
                            النوادي
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <Users />
                            المشرفين
                        </Link>
                        <Link
                            href="#stat"
                            className="flex gap-2 hover:bg-zinc-100 hover:ring-2 ring-primary rounded-md w-full px-2 py-1 "
                        >
                            <Settings />
                            الاعدادات
                        </Link>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <Button className="flex gap-2 rounded-md w-full">
                            <LogOut />
                            تسجيل الخروج
                        </Button>
                    </div>
                </nav>
            </aside>
            <div className="flex-1 w-full my-5 mx-5 sm:ms-0 bg-background bg-zinc-50 border-2 border-gray-100 rounded-xl">
                <main className="p-5">
                    {collapsed ? "true" : "false"}
                    {children}
                </main>
            </div>
        </div>
    );
}
