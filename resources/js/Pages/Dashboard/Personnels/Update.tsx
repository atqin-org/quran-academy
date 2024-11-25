import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import ProfessorForm from "./Components/ProfessorForm";
import { TPersonnelForm, TPersonnelFormDB } from "./Types/Personnel";

interface DashboardProps extends PageProps {
    personnel: TPersonnelFormDB;
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function UpdatePersonnel({
    auth,
    personnel,
    clubs,
    categories,
}: DashboardProps) {
    const { data, setData, post, processing, errors } =
        useInertiaForm<TPersonnelForm>({
            firstName: personnel.first_name,
            lastName: personnel.last_name,
            mail: personnel.mail,
            phone: personnel.phone,
            club: personnel.club_id?.toString() || "",
            role: personnel.role_id?.toString() || "", // Convert role_id to a string for role
            card: personnel.card || undefined,
        });

    const url = window.location.href;
    const from = url.split("/");
    const place = url.split("/").length;
    const id = from[place - 2];

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(`/personnels/${id}`);
    }

    return (
        <DashboardLayout user={auth.user}>
            <Head title="Update Personnel" />

            <div className="flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    تسجيل المواقف البشرية
                </h1>
                <ProfessorForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    clubs={clubs}
                    categories={categories}
                    processing={processing}
                    mode="edit"
                    personnelId={id}
                    handleSubmit={handleSubmit}
                />
            </div>
        </DashboardLayout>
    );
}
