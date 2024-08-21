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
    fatherJob: "",
    fatherPhone: "",
    motherJob: "",
    motherPhone: "",
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

    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: data,
    });

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
                            post("/dashboard/students");
                            resolve("تم التسجيل بنجاح");
                        } catch (error) {
                            reject("حدث خطأ اثناء التسجيل");
                        }
                    }),
                    {
                        loading: "جاري التسجيل ...",
                        success: "تم التسجيل بنجاح",
                        error: "حدث خطأ اثناء التسجيل",
                    }
                );
            } else {
                toast.error("يرجى التحقق من البيانات");
            }
        });
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
                    form={form}
                    mode="create"
                    handleSubmit={handleSubmit}
                />
            </div>
        </DashboardLayout>
    );
}
