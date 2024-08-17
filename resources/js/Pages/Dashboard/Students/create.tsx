import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Button } from "@/Components/ui/button";
import { z } from "zod";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { Input } from "@/Components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/Components/ui/calendar";
import { format } from "date-fns";
import { Switch } from "@/Components/ui/switch";
import Dropzone, { DropzoneState } from "@/Components/costume-cn/Dropzone";
import { FormSchema } from "@/Data/Zod/Students";
import { Label } from "@/Components/ui/label";
import FileUploaded from "@/Components/costume-cn/FileUploaded";

interface StudentForm {
    firstName: string;
    lastName: string;
    gender: string;
    birthdate: Date | undefined;
    socialStatus: string;
    hasCronicDisease: string;
    cronicDisease?: string;
    familyStatus?: string;
    fatherJob: string;
    motherJob: string;
    fatherPhone?: string;
    motherPhone?: string;
    club: string;
    category: string;
    subscription: string;
    insurance: boolean;
    picture?: File;
    file?: File;
}
const initialFormState: StudentForm = {
    firstName: "",
    lastName: "",
    gender: "",
    birthdate: undefined,
    socialStatus: "",
    hasCronicDisease: "",
    cronicDisease: "",
    familyStatus: "",
    fatherJob: "",
    fatherPhone: "",
    motherJob: "",
    motherPhone: "",
    club: "",
    category: "",
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
        useForm<StudentForm>(initialFormState);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        console.log(data);
        toast.promise(
            new Promise(async (resolve, reject) => {
                try {
                    console.log(post("/dashboard/students"));
                } catch (error) {
                    reject(error);
                }
            }),
            {
                loading: "جاري التسجيل ...",
                success: "تم التسجيل بنجاح",
                error: "حدث خطأ اثناء التسجيل",
            }
        );
    }
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Dashboard" />

            <div className=" flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    تسجيل الطالب
                </h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Button type="submit" disabled={processing}>
                        تسجيل
                    </Button>
                    <div>
                        <Label>النادي</Label>
                        <Select
                            onValueChange={(value) => setData("club", value)}
                            defaultValue={data.club}
                            dir="rtl"
                        >
                            <SelectTrigger
                                className={data.club ? "" : "text-slate-500"}
                            >
                                <SelectValue placeholder="اختر نادي" />
                            </SelectTrigger>
                            <SelectContent>
                                {clubs.map((club) => (
                                    <SelectItem
                                        key={club.id}
                                        value={club.id.toString()}
                                    >
                                        {club.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.club && (
                            <span className="text-red-500">{errors.club}</span>
                        )}
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className="w-full">
                            <Label>الاسم</Label>
                            <Input
                                value={data.firstName}
                                onChange={(e) =>
                                    setData("firstName", e.target.value)
                                }
                                placeholder="اكتب الاسم ..."
                                dir="rtl"
                            />
                            {errors.firstName && (
                                <span className="text-red-500">
                                    {errors.firstName}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label>اللقب</Label>
                            <Input
                                value={data.lastName}
                                onChange={(e) =>
                                    setData("lastName", e.target.value)
                                }
                                placeholder="اكتب اللقب ..."
                                dir="rtl"
                            />
                            {errors.lastName && (
                                <span className="text-red-500">
                                    {errors.lastName}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label>الجنس</Label>
                            <Select
                                onValueChange={(value) =>
                                    setData("gender", value)
                                }
                                defaultValue={data.gender}
                                dir="rtl"
                            >
                                <SelectTrigger
                                    className={
                                        data.gender ? "" : "text-slate-500"
                                    }
                                >
                                    <SelectValue placeholder="اختر الجنس ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key={0} value={"male"}>
                                        {"ذكر"}
                                    </SelectItem>
                                    <SelectItem key={1} value={"female"}>
                                        {"انثى"}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.gender && (
                                <span className="text-red-500">
                                    {errors.gender}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className=" w-full">
                            <Label className=" w-full">تاريخ الميلاد</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            " flex justify-between w-full pl-3 font-normal",
                                            !data.birthdate &&
                                                "text-muted-foreground"
                                        )}
                                    >
                                        {data.birthdate ? (
                                            format(data.birthdate, "yyyy/MM/dd")
                                        ) : (
                                            <span>اليوم / الشهر / السنة</span>
                                        )}
                                        <CalendarIcon className="h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        defaultMonth={data.birthdate}
                                        selected={data.birthdate}
                                        onSelect={(date) =>
                                            setData("birthdate", date)
                                        }
                                        fromYear={1900}
                                        toYear={new Date().getFullYear()}
                                        fixedWeeks
                                        captionLayout="dropdown-buttons"
                                        disabled={(date) =>
                                            date > new Date() ||
                                            date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.birthdate && (
                                <span className="text-red-500">
                                    {errors.birthdate}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label>الحالة الاجتماعية</Label>
                            <Select
                                onValueChange={(value) =>
                                    setData("socialStatus", value)
                                }
                                defaultValue={data.socialStatus}
                                dir="rtl"
                            >
                                <SelectTrigger
                                    className={
                                        data.socialStatus
                                            ? ""
                                            : "text-slate-500"
                                    }
                                >
                                    <SelectValue placeholder="اختر الحالة الاجتماعية ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key="good" value="good">
                                        {"ميسورة"}
                                    </SelectItem>
                                    <SelectItem key="mid" value="mid">
                                        {"متوسطة"}
                                    </SelectItem>
                                    <SelectItem key="low" value="low">
                                        {"معوزة"}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.socialStatus && (
                                <span className="text-red-500">
                                    {errors.socialStatus}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className="w-full">
                            <Label>هل يعاني من مرض مزمن؟</Label>
                            <Select
                                onValueChange={(value) =>
                                    setData("hasCronicDisease", value)
                                }
                                defaultValue={data.hasCronicDisease}
                                dir="rtl"
                            >
                                <SelectTrigger
                                    className={
                                        data.hasCronicDisease
                                            ? ""
                                            : "text-slate-500"
                                    }
                                >
                                    <SelectValue placeholder="اختر ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem key="yes" value="yes">
                                        {"نعم"}
                                    </SelectItem>
                                    <SelectItem key="no" value="no">
                                        {"لا"}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.hasCronicDisease && (
                                <span className="text-red-500">
                                    {errors.hasCronicDisease}
                                </span>
                            )}
                        </div>
                        {data.hasCronicDisease === "yes" && (
                            <div className="w-full">
                                <Label>ماهو المرض؟</Label>
                                <Input
                                    value={data.cronicDisease}
                                    onChange={(e) =>
                                        setData("cronicDisease", e.target.value)
                                    }
                                    placeholder="اكتب ..."
                                    dir="rtl"
                                />
                                {errors.cronicDisease && (
                                    <span className="text-red-500">
                                        {errors.cronicDisease}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="w-full">
                        <Label>الحالة العائلية</Label>
                        <Input
                            value={data.familyStatus}
                            onChange={(e) =>
                                setData("familyStatus", e.target.value)
                            }
                            placeholder="اكتب ملاحظات عن الحالة العائلية ان وجدت ..."
                            dir="rtl"
                        />
                        {errors.familyStatus && (
                            <span className="text-red-500">
                                {errors.familyStatus}
                            </span>
                        )}
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className="w-full">
                            <Label>وظيفة الاب</Label>
                            <Input
                                value={data.fatherJob}
                                onChange={(e) =>
                                    setData("fatherJob", e.target.value)
                                }
                                placeholder="اكتب ..."
                                dir="rtl"
                            />
                            {errors.fatherJob && (
                                <span className="text-red-500">
                                    {errors.fatherJob}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label>رقم هاتف الاب</Label>
                            <Input
                                value={data.fatherPhone}
                                onChange={(e) =>
                                    setData("fatherPhone", e.target.value)
                                }
                                placeholder="اكتب ..."
                                dir="rtl"
                            />
                            {errors.fatherPhone && (
                                <span className="text-red-500">
                                    {errors.fatherPhone}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className="w-full">
                            <Label>وظيفة الام</Label>
                            <Input
                                value={data.motherJob}
                                onChange={(e) =>
                                    setData("motherJob", e.target.value)
                                }
                                placeholder="اكتب ..."
                                dir="rtl"
                            />
                            {errors.motherJob && (
                                <span className="text-red-500">
                                    {errors.motherJob}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label>رقم هاتف الام</Label>
                            <Input
                                value={data.motherPhone}
                                onChange={(e) =>
                                    setData("motherPhone", e.target.value)
                                }
                                placeholder="اكتب ..."
                                dir="rtl"
                            />
                            {errors.motherPhone && (
                                <span className="text-red-500">
                                    {errors.motherPhone}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className="w-full">
                            <Label>الفئة</Label>
                            <Select
                                onValueChange={(value) =>
                                    setData("category", value)
                                }
                                defaultValue={data.category}
                                dir="rtl"
                            >
                                <SelectTrigger
                                    className={
                                        data.category ? "" : "text-slate-500"
                                    }
                                >
                                    <SelectValue placeholder="اختر الفئة ..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={category.id.toString()}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <span className="text-red-500">
                                    {errors.category}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label className="truncate">الاشتراك الشهري</Label>
                            <Input
                                value={data.subscription}
                                onChange={(e) =>
                                    setData("subscription", e.target.value)
                                }
                                placeholder="اكتب ..."
                                dir="rtl"
                            />
                            {errors.subscription && (
                                <span className="text-red-500">
                                    {errors.subscription}
                                </span>
                            )}
                        </div>
                        <div
                            dir="ltr"
                            className="flex flex-row items-center justify-between gap-10 rounded-lg border p-4"
                        >
                            <div className="space-y-0.5 text-nowrap flex flex-col truncate">
                                <Label className="text-base">التامين</Label>
                                <span dir="rtl">200 دج سنويا</span>
                                {errors.insurance && (
                                    <span className="text-red-500">
                                        {errors.insurance}
                                    </span>
                                )}
                            </div>
                            <Switch
                                checked={data.insurance}
                                onCheckedChange={(value) =>
                                    setData("insurance", value)
                                }
                            />
                        </div>
                    </div>
                    <div className="flex sm:flex-row flex-col gap-6 w-full">
                        <div className="w-full">
                            <Label>الصورة الشخصية</Label>
                            {data.picture === undefined ? (
                                <Dropzone
                                    onDrop={(acceptedFiles) => {
                                        if (acceptedFiles.length > 0) {
                                            setData(
                                                "picture",
                                                acceptedFiles[0]
                                            );
                                        }
                                    }}
                                />
                            ) : (
                                <FileUploaded
                                    file={data.picture}
                                    setData={setData}
                                    name="picture"
                                />
                            )}
                            {errors.picture && (
                                <span className="text-red-500">
                                    {errors.picture}
                                </span>
                            )}
                        </div>
                        <div className="w-full">
                            <Label>شهادة الميلاد</Label>
                            {data.file === undefined ? (
                                <Dropzone
                                    onDrop={(acceptedFiles) => {
                                        if (acceptedFiles.length > 0) {
                                            setData("file", acceptedFiles[0]);
                                        }
                                    }}
                                />
                            ) : (
                                <FileUploaded
                                    file={data.file}
                                    setData={setData}
                                    name="file"
                                />
                            )}
                            {errors.file && (
                                <span className="text-red-500">
                                    {errors.file}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button type="submit" disabled={processing}>
                        تسجيل
                    </Button>
                </form>
            </div>
        </DashboardLayout>
    );
}
