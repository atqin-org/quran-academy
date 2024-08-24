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

export default function Index({
    auth,
    laravelVersion,
    phpVersion,
    forms,
}: PageProps<{ laravelVersion: string; phpVersion: string; forms: TForm[] }>) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Form" />
            <Table className="w-full">
                <TableCaption>A list of your recent forms.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">CreateAt</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {forms.map((form) => (
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
                                ...
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
               
            </Table>
        </DashboardLayout>
    );
}
