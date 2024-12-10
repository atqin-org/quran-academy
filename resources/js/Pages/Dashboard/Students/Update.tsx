import DashboardLayout from "@/Layouts/DashboardLayout";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import StudentForm from "./Components/StudentForm";
import { TStudentForm, TStudentFormDB, TSiblings } from "./Types/Student";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import {
    Table,
    TableBody,
    TableCaption,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";

interface DashboardProps extends PageProps {
    student: TStudentFormDB;
    siblings: TSiblings[];
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Update({
    auth,
    student,
    siblings,
    clubs,
    categories,
}: DashboardProps) {
    console.log(siblings);
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

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function getBadgeColor(dateString: string) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for comparison

        if (date < today) {
            return "bg-red-500";
        } else if (date.toDateString() === today.toDateString()) {
            return "bg-orange-500";
        } else {
            return "bg-green-500";
        }
    }
    function getColorByGender(gender: string) {
        if (gender === "father") gender = "male";
        if (gender === "mother") gender = "female";

        switch (gender) {
            case "male":
                return "decoration-blue-600";
            case "female":
                return "decoration-pink-600";
            default:
                return "decoration-black";
        }
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
                {siblings.length > 0 && (
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            الأشقاء ({siblings.length}):
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {siblings.map((sibling) => (
                                <Card
                                    key={sibling.id}
                                    className={`bg-white rounded-lg shadow-lg drop-shadow-xl ${
                                        sibling.shared_guardian === "both"
                                            ? "shadow-gray-500"
                                            : sibling.shared_guardian ===
                                              "father"
                                            ? "shadow-blue-500"
                                            : "shadow-pink-500"
                                    }`}
                                >
                                    <CardHeader>
                                        <CardTitle
                                            onClick={() => {
                                                window.location.href = `/students/${sibling.id}/edit`;
                                            }}
                                            className={
                                                `text-xl hover:cursor-pointer hover:text-gray-900 font-bold underline underline-offset-4 text-black ` +
                                                getColorByGender(sibling.gender)
                                            }
                                        >
                                            {sibling.first_name}{" "}
                                            {sibling.last_name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-2">
                                        <p className="text-gray-600">
                                            تاريخ الميلاد:{" "}
                                            {new Date(
                                                sibling.birthdate
                                            ).toLocaleDateString("fr-DZ")}
                                        </p>
                                        <p className="text-gray-600">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>
                                                            الاشتراك
                                                        </TableHead>
                                                        <TableHead>
                                                            التأمين
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    <TableRow>
                                                        <td>
                                                            {sibling.subscription_expire_at ? (
                                                                <Badge
                                                                    className={getBadgeColor(
                                                                        sibling.subscription_expire_at
                                                                    )}
                                                                >
                                                                    {formatDate(
                                                                        sibling.subscription_expire_at
                                                                    )}
                                                                </Badge>
                                                            ) : (
                                                                "N/A"
                                                            )}
                                                        </td>
                                                        <td>
                                                            {sibling.insurance_expire_at ? (
                                                                <Badge
                                                                    className={getBadgeColor(
                                                                        sibling.insurance_expire_at
                                                                    )}
                                                                >
                                                                    {formatDate(
                                                                        sibling.insurance_expire_at
                                                                    )}
                                                                </Badge>
                                                            ) : (
                                                                "N/A"
                                                            )}
                                                        </td>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </p>
                                        <p className="text-gray-600">
                                            الأحزاب: {sibling.ahzab}
                                        </p>
                                        <span className="flex gap-1 text-gray-600">
                                            الفئة:
                                            <p
                                                className={` ${(() => {
                                                    switch (
                                                        sibling.category.gender
                                                    ) {
                                                        case "male":
                                                            return "text-blue-600";
                                                        case "female":
                                                            return "text-pink-600";
                                                        default:
                                                            return "text-black";
                                                    }
                                                })()}`}
                                            >
                                                {sibling.category.name}
                                            </p>
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
