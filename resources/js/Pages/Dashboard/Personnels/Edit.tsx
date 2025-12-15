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

export default function Edit({
    auth,
    personnel,
    clubs,
    categories,
}: DashboardProps) {
    const initialFormState: TPersonnelForm = {
        firstName: personnel.name,
        lastName: personnel.last_name,
        mail: personnel.email,
        phone: personnel.phone || "",
        clubs: personnel.clubs.map((c) => c.id),
        role: personnel.role,
        card: personnel.card || undefined,
    };

    const { data, setData, post, processing, errors } = useInertiaForm<
        TPersonnelForm & { [key: string]: any }
    >(initialFormState);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(`/personnels/${personnel.id}`);
    }

    return (
        <DashboardLayout user={auth.user}>
            <Head title="تعديل الموظف" />

            <div className="flex flex-col gap-10">
                <h1 className="text-2xl font-bold text-gray-900">
                    تعديل بيانات الموظف
                </h1>
                <ProfessorForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    clubs={clubs}
                    categories={categories}
                    processing={processing}
                    mode="edit"
                    personnelId={String(personnel.id)}
                    handleSubmit={handleSubmit}
                    initialClubs={personnel.clubs.map((c) => c.id)}
                />
            </div>
        </DashboardLayout>
    );
}
