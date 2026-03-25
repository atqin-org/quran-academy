import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { StudentDisplay, getColumns } from "./Components/Columns";
import { DataTable, perPageOptions } from "./Components/DataTable";
import { Button } from "@/Components/ui/button";
import { Archive, ArrowRight, Plus } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

interface DashboardProps extends PageProps {
    students: { data: StudentDisplay[]; links: any[] };
    archived: boolean;
    dataDependencies: {
        categories: {
            id: number;
            name: string;
            students_count: number;
            gender: string | null;
        }[];
        clubs: { id: number; name: string; students_count: number }[];
        genders: { gender: string; total: number }[];
    };
    flash?: {
        success?: string;
        error?: string;
    };
}
export default function Dashboard({
    auth,
    students,
    archived,
    dataDependencies,
}: DashboardProps) {
    const { props } = usePage<DashboardProps>();
    const flash = props.flash;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const columns = useMemo(() => getColumns(archived), [archived]);
    const urlParams = new URLSearchParams(location.search);

    const searchQuery = urlParams.get("search");
    const sortByQuery = urlParams.get("sortBy");
    const sortTypeQuery = urlParams.get("sortType");

    const getArrayFromParams = (paramName: string) => {
        const result: string[] = [];
        let index = 0;
        while (urlParams.has(`${paramName}[${index}]`)) {
            result.push(urlParams.get(`${paramName}[${index}]`) as string);
            index++;
        }
        return result;
    };

    const perPageQuery = urlParams.get("per_page");
    const currentPerPage = perPageQuery ? parseInt(perPageQuery) : 10;

    const searchParams = {
        categories: getArrayFromParams("categories"),
        clubs: getArrayFromParams("clubs"),
        gender: getArrayFromParams("gender"),
        search: searchQuery,
        sortBy: sortByQuery,
        sortType: sortTypeQuery,
        per_page: perPageQuery,
        archived,
    };

    const handlePerPageChange = (value: string) => {
        const params = new URLSearchParams(location.search);
        if (value === "10") {
            params.delete("per_page");
        } else {
            params.set("per_page", value);
        }
        // Reset to page 1 when changing per_page
        params.delete("page");
        router.get(
            `${route("students.index")}?${params.toString()}`,
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const translatedLinks = students.links.map((link, index) => {
        if (index === 0) {
            link.label = "&laquo;السابق";
        } else if (index === students.links.length - 1) {
            link.label = "التالي&raquo;";
        }
        return link;
    });
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Students" />
            <div className="flex flex-col items-center justify-start h-full">
                <div className="flex items-center justify-between w-full">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {archived ? "الأرشيف" : "الطالب"}
                    </h1>
                    <div className="flex items-center gap-2">
                        {archived ? (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() =>
                                    router.get(
                                        route("students.index"),
                                        {},
                                        { preserveState: true }
                                    )
                                }
                            >
                                <ArrowRight className="h-4 w-4" />
                                العودة للقائمة
                            </Button>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() =>
                                        router.get(
                                            route("students.index"),
                                            { archived: true },
                                            { preserveState: true }
                                        )
                                    }
                                >
                                    <Archive className="h-4 w-4" />
                                    الأرشيف
                                </Button>
                                <Link href="/students/create">
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        طالب جديد
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
                <DataTable
                    key={location.search}
                    columns={columns}
                    data={students.data}
                    searchParams={searchParams}
                    dataDependencies={dataDependencies}
                />
                <div className="mt-4 mb-1 flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground">عرض</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 px-2.5">
                                    {currentPerPage}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                                <DropdownMenuRadioGroup
                                    dir="rtl"
                                    value={String(currentPerPage)}
                                    onValueChange={handlePerPageChange}
                                >
                                    {perPageOptions.map((option) => (
                                        <DropdownMenuRadioItem
                                            key={option}
                                            value={String(option)}
                                        >
                                            {option}
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex">
                        {translatedLinks.map((link) =>
                            link.url ? (
                                <Link
                                    preserveState
                                    key={link.label}
                                    href={link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`p-1.5 md:px-2.5 mx-1 rounded-lg select-none ${
                                        link.active
                                            ? "text-primary-foreground text-base font-bold bg-primary"
                                            : "text-neutral-600 hover:text-neutral-950 hover:ring-2 ring-primary"
                                    } ${
                                        !isNaN(link.label) || link.label === "..."
                                            ? "lg:inline-block hidden"
                                            : ""
                                    }`}
                                />
                            ) : (
                                <span
                                    key={link.label}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`p-1.5 mx-1 rounded-lg select-none text-neutral-400 ${
                                        !isNaN(link.label) || link.label === "..."
                                            ? "lg:inline-block hidden"
                                            : ""
                                    }`}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
