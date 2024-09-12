import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { StudentDisplay, columns } from "./Components/Columns";
import { DataTable } from "./Components/DataTable";

interface DashboardProps extends PageProps {
    students: { data: StudentDisplay[]; links: any[] };
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
}
export default function Dashboard({
    auth,
    students,
    dataDependencies,
}: DashboardProps) {
    //onload check &search= query param
    // Extract search query parameter
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

    const searchParams = {
        categories: getArrayFromParams("categories"),
        clubs: getArrayFromParams("clubs"),
        gender: getArrayFromParams("gender"),
        search: searchQuery,
        sortBy: sortByQuery,
        sortType: sortTypeQuery,
    };

    // Filter students based on search query
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
                <div className="flex items-center w-full">
                    <h1 className="text-4xl font-bold text-gray-900">الطالب</h1>
                    <div className="flex-1"></div>
                    <Link
                        className="text-primary-foreground font-bold text-center bg-primary p-4 rounded-xl select-none"
                        href="/students/create"
                    >
                        سجل طالب جديد
                    </Link>
                </div>
                <DataTable
                    columns={columns}
                    data={students.data}
                    searchParams={searchParams}
                    dataDependencies={dataDependencies}
                />
                <div className="mt-4 mb-1 flex">
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
        </DashboardLayout>
    );
}
