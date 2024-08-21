import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/Data/Zod/Students";
import { toast } from "sonner";
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
            hasCronicDisease: student.has_cronic_disease ? "yes" : "no",
            cronicDisease: student.cronic_disease || "",
            familyStatus: student.family_status || "",
            fatherJob: student.father_job || "",
            motherJob: student.mother_job || "",
            fatherPhone: student.father_phone || "",
            motherPhone: student.mother_phone || "",
            club: student.id_club.toString(),
            category: student.id_category.toString(),
            subscription: student.subscription,
            picture: student.picture || undefined,
            file: student.file || undefined,
        });

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: data,
    });

    const url = window.location.href;
    const from = url.lastIndexOf("/");
    const id = url.substring(from, from - 1);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        form.setValue("firstName", data.firstName);
        form.setValue("lastName", data.lastName);
        form.setValue("gender", data.gender);
        form.setValue("birthdate", data.birthdate);
        form.setValue("socialStatus", data.socialStatus);
        form.setValue("hasCronicDisease", data.hasCronicDisease);
        form.setValue("cronicDisease", data.cronicDisease);
        form.setValue("familyStatus", data.familyStatus);
        form.setValue("fatherJob", data.fatherJob);
        form.setValue("fatherPhone", data.fatherPhone);
        form.setValue("motherJob", data.motherJob);
        form.setValue("motherPhone", data.motherPhone);
        form.setValue("club", data.club);
        form.setValue("category", data.category);
        form.setValue("subscription", data.subscription);
        form.setValue("insurance", data.insurance);
        form.setValue("picture", data.picture);
        form.setValue("file", data.file);

        form.trigger().then((isValid) => {
            if (isValid) {
                toast.promise(
                    new Promise(async (resolve, reject) => {
                        try {
                            post(`/dashboard/students/${id}`);
                            resolve("تم التحديث بنجاح");
                        } catch (error) {
                            reject("حدث خطأ اثناء التحديث");
                        }
                    }),
                    {
                        loading: "جاري التحديث ...",
                        success: "تم التحديث بنجاح",
                        error: "حدث خطأ اثناء التحديث",
                    }
                );
            } else toast.error("يرجى التحقق من البيانات");
        });
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
                    form={form}
                    mode="edit"
                    handleSubmit={handleSubmit}
                />
            </div>
        </DashboardLayout>
    );
}
