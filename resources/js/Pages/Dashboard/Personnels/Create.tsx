import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import ProfessorForm from "./Components/ProfessorForm";
import { TPersonnelForm } from "./Types/Personnel";

const initialFormState: TPersonnelForm = {
    firstName: "",
    lastName: "",
    mail: "",
    phone: "",
    club: undefined,
    role: undefined,
    card: undefined,
};

interface DashboardProps extends PageProps {
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Dashboard({ auth, clubs, categories }: DashboardProps) {
    const { data, setData, post, processing, errors } =
        useInertiaForm<TPersonnelForm>(initialFormState);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post("/students");
    }
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className=" flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    تسجيل المواقف البشرية
                </h1>
                <ProfessorForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    clubs={clubs}
                    processing={processing}
                    mode="create"
                    handleSubmit={handleSubmit}
                />
            </div>
        </DashboardLayout>
    );
}
