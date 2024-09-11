import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/Data/Zod/Students";
import { toast } from "sonner";
import StudentForm from "./Components/StudentForm";
import { TStudentForm } from "./Types/Student";

const initialFormState: TStudentForm = {
    firstName: "",
    lastName: "",
    gender: undefined,
    birthdate: undefined,
    socialStatus: undefined,
    hasCronicDisease: undefined,
    cronicDisease: "",
    familyStatus: "",
    father: {
        name: "",
        job: "",
        phone: "",
    },
    mother: {
        name: "",
        job: "",
        phone: "",
    },
    club: undefined,
    category: undefined,
    subscription: "",
    insurance: false,
    picture: undefined,
    file: undefined,
};

interface DashboardProps extends PageProps {
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Dashboard({ auth, clubs, categories }: DashboardProps) {
    const { data, setData, post, processing, errors } =
        useInertiaForm<TStudentForm>(initialFormState);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post("/dashboard/students");
    }
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className=" flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    تسجيل الطالب
                </h1>
                <StudentForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    clubs={clubs}
                    categories={categories}
                    processing={processing}
                    mode="create"
                    handleSubmit={handleSubmit}
                />
            </div>
        </DashboardLayout>
    );
}
