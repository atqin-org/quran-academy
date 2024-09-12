import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import StudentForm from "./Components/StudentForm";
import { TStudentForm, TStudentFormDB } from "./Types/Student";

interface DashboardProps extends PageProps {
    student: TStudentFormDB;
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Update({
    auth,
    student,
    clubs,
    categories,
}: DashboardProps) {
    const { data, setData, post, processing, errors } =
        useInertiaForm<TStudentForm>({
            firstName: student.first_name,
            lastName: student.last_name,
            gender: student.gender,
            birthdate: student.birthdate,
            socialStatus: student.social_status,
            hasCronicDisease: student.cronic_disease ? "yes" : "no",
            cronicDisease: student.cronic_disease || "",
            familyStatus: student.family_status || "",
            father: {
                name: student.father?.name || "",
                job: student.father?.job || "",
                phone: student.father?.phone || "",
            },
            mother: {
                name: student.mother?.name || "",
                job: student.mother?.job || "",
                phone: student.mother?.phone || "",
            },
            club: student.club_id.toString(),
            category: student.category_id.toString(),
            subscription: student.subscription,
            picture: student.picture || undefined,
            file: student.file || undefined,
        });

    const url = window.location.href;
    const from = url.split("/");
    const place = url.split("/").length;
    const id = from[place - 2];

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(`/students/${id}`);
    }

    return (
        <DashboardLayout user={auth.user}>
            <Head title="Update Student" />

            <div className="flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    تحديث بيانات الطالب
                </h1>
                <StudentForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    clubs={clubs}
                    categories={categories}
                    processing={processing}
                    mode="edit"
                    studentId={id}
                    handleSubmit={handleSubmit}
                />
            </div>
        </DashboardLayout>
    );
}
