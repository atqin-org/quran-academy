import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { StudentDisplay, columns } from "./Components/Columns";
import { DataTable } from "./Components/DataTable";


interface DashboardProps extends PageProps {
    personnels: { data: StudentDisplay[]; links: any[] };
    dataDependencies: {
        categories: {
            id: number;
            name: string;
            personnels_count: number;
            gender: string | null;
        }[];
        clubs: { id: number; name: string; personnels_count: number }[];
        genders: { gender: string; total: number }[];
    };
}
export default function Dashboard({
    auth,
    personnels,
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

    return (
        <DashboardLayout user={auth.user}>
            <Head title="Students" />
            <div className="flex flex-col items-center justify-start h-full">
                <div className="flex items-center w-full">
                    <h1 className="text-4xl font-bold text-gray-900">الطالب</h1>
                    <div className="flex-1"></div>
                    <Link
                        className="text-primary-foreground font-bold text-center bg-primary p-4 rounded-xl select-none"
                        href="/personnels/create"
                    >
                        سجل جديد
                    </Link>
                </div>
                <div className="w-full mt-10">
                    {/* card for users */}
                    (personnels.data.length {">"} 0 ? (
                        foreach (personnels.data as personnel) {
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-gray-200"></div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {personnel.name} {personnel.last_name}
                                        </h1>
                                        <p className="text-lg text-gray-600">{personnel.club}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg text-gray-600">الهاتف: {personnel.phone}</p>
                                    <p className="text-lg text-gray-600">البريد: {personnel.mail}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg text-gray-600">الدور: {personnel.role}</p>
                                    <p className="text-lg text-gray-600">البطاقة: {personnel.card}</p>
                                </div>
                            </div>
                        }
                    )

                </div>

            </div>
        </DashboardLayout>
    );
}
