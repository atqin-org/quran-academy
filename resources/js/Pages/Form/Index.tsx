import { Link, Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import Guest from "@/Layouts/GuestLayout";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/Components/ui/pagination";
import { Button } from "@/Components/ui/button";
import { MoreHorizontal } from "lucide-react";

export default function Index({
    auth,
    laravelVersion,
    phpVersion,
    forms,
}: PageProps<{ laravelVersion: string; phpVersion: string; forms: any }>) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Form" />
            <div className="space-y-7">
                <div className="flex justify-between">
                    <h1 className="text-2xl font-semibold">فورم</h1>

                    <Button asChild>
                        <Link
                            href={route("forms.create")}
                            className="btn btn-primary"
                        >
                            إنشاء نموذج جديد
                        </Link>
                    </Button>
                </div>
                <Table className="w-full">
                    <TableCaption>A list of your recent forms.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">الأيدي</TableHead>
                            <TableHead>إسم الفولام</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">
                                تم إنشائه في
                            </TableHead>
                            <TableHead className="text-right">
                                الأكشن يا كابتن
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.data.map((form: TForm) => (
                            <TableRow key={form.id}>
                                <TableCell className="font-medium">
                                    {form.id}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {form.name}
                                </TableCell>

                                <TableCell>{form.description}</TableCell>
                                <TableCell className="text-right">
                                    {form.created_at}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                            >
                                                <span className="sr-only">
                                                    Open menu
                                                </span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>
                                                الأكشنز
                                            </DropdownMenuLabel>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route("forms.edit", [
                                                        form.id,
                                                    ])}
                                                >
                                                    {" "}
                                                    تعديل
                                                </Link>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={route(
                                                        "forms.destroy",
                                                        [form.id]
                                                    )}
                                                >
                                                    {" "}
                                                    حذف
                                                </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            
                <div className="flex justify-center mt-6">
                    <nav
                        aria-label="Pagination"
                        className="inline-flex space-x-1"
                    >
                        {forms.links.map((link, index) => {
                            if (link.label === "&laquo; Previous") {
                                return (
                                    <a
                                        key={index}
                                        href={link.url || "#"}
                                        className={`px-4 py-2 rounded-l-lg border ${
                                            link.url
                                                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            }

                            if (link.label === "Next &raquo;") {
                                return (
                                    <a
                                        key={index}
                                        href={link.url || "#"}
                                        className={`px-4 py-2 rounded-r-lg border ${
                                            link.url
                                                ? "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                : "bg-gray-200 text-gray-500"
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                );
                            }

                            if (link.label === "...") {
                                return (
                                    <span
                                        key={index}
                                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300"
                                    >
                                        &hellip;
                                    </span>
                                );
                            }

                            return (
                                <a
                                    key={index}
                                    href={link.url || "#"}
                                    className={`px-4 py-2 border ${
                                        link.active
                                            ? "bg-blue-500 text-white border-blue-500"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            );
                        })}
                    </nav>
                </div>
            </div>
        </DashboardLayout>
    );
}
