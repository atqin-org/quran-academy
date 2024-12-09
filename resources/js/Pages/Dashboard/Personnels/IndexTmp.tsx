import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, Link } from "@inertiajs/react";
import { TPersonnelFormDB } from "./Types/Personnel";
import { DataTable } from "./Components/DataTable";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";

interface DashboardProps extends PageProps {
    personnels: TPersonnelFormDB[];
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
    console.log(personnels);
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
                <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {personnels.map((personnel, index) => (
                        <Card
                            key={index}
                            className="bg-white shadow-lg rounded-lg"
                        >
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900">
                                    {personnel.name} {personnel.last_name}
                                </CardTitle>
                                <CardDescription className="text-lg text-gray-600">
                                    {personnel.email}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                <p className="text-lg text-gray-600">
                                    الهاتف: {personnel.phone}
                                </p>
                                <p className="text-lg text-gray-600">
                                    البريد: {personnel.email}
                                </p>
                                <p className="text-lg text-gray-600">
                                    الدور: {personnel.role}
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {personnel.clubs.map((club, clubIndex) => (
                                        <Badge key={clubIndex} className="text-nowrap">
                                            {club.name}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
