import Dropzone from "@/Components/costume-cn/Dropzone";
import FileUploaded from "@/Components/costume-cn/FileUploaded";
import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Switch } from "@/Components/ui/switch";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { cn } from "@/lib/utils";
import { PageProps } from "@/types";
import { Head, useForm as useInertiaForm } from "@inertiajs/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/Data/Zod/Students";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import FormErrorMessage from "@/Components/costume-cn/FormErrorMessage";

interface StudentForm {
    firstName: string | undefined;
    lastName: string | undefined;
    gender: string | undefined;
    birthdate: Date | undefined;
    socialStatus: string | undefined;
    hasCronicDisease: string | undefined;
    cronicDisease?: string | undefined;
    familyStatus?: string | undefined;
    fatherJob: string | undefined;
    motherJob: string | undefined;
    fatherPhone?: string | undefined;
    motherPhone?: string | undefined;
    club: string | undefined;
    category: string | undefined;
    subscription: string | undefined;
    insurance: boolean | undefined;
    picture?: File;
    file?: File;
}
const initialFormState: StudentForm = {
    firstName: undefined,
    lastName: undefined,
    gender: undefined,
    birthdate: undefined,
    socialStatus: undefined,
    hasCronicDisease: undefined,
    cronicDisease: undefined,
    familyStatus: undefined,
    fatherJob: undefined,
    fatherPhone: undefined,
    motherJob: undefined,
    motherPhone: undefined,
    club: undefined,
    category: undefined,
    subscription: undefined,
    insurance: undefined,
    picture: undefined,
    file: undefined,
};

interface DashboardProps extends PageProps {
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Dashboard({ auth, clubs, categories }: DashboardProps) {
    const { data, setData, post, processing, errors } =
        useInertiaForm<StudentForm>(initialFormState);

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
        //validate form
        form.trigger().then((isValid) => {
            if (isValid) {
                console.log("form is valid");
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
                console.log("form is not valid");
                console.log(form.formState.errors);
                toast.error("يرجى التحقق من البيانات");
            }
        });
        console.log("form values", form.getValues());
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
                        <FormErrorMessage
                            formStateErrors={form.formState.errors.club}
                            errors={errors.club}
                        />
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
                            <FormErrorMessage
                                formStateErrors={form.formState.errors.lastName}
                                errors={errors.lastName}
                            />
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
                            <FormErrorMessage
                                formStateErrors={form.formState.errors.gender}
                                errors={errors.gender}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.birthdate
                                }
                                errors={errors.birthdate}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.socialStatus
                                }
                                errors={errors.socialStatus}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.hasCronicDisease
                                }
                                errors={errors.hasCronicDisease}
                            />
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
                                <FormErrorMessage
                                    formStateErrors={
                                        form.formState.errors.cronicDisease
                                    }
                                    errors={errors.cronicDisease}
                                />
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
                        <FormErrorMessage
                            formStateErrors={form.formState.errors.familyStatus}
                            errors={errors.familyStatus}
                        />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.fatherJob
                                }
                                errors={errors.fatherJob}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.fatherPhone
                                }
                                errors={errors.fatherPhone}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.motherJob
                                }
                                errors={errors.motherJob}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.motherPhone
                                }
                                errors={errors.motherPhone}
                            />
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
                            <FormErrorMessage
                                formStateErrors={form.formState.errors.category}
                                errors={errors.category}
                            />
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
                            <FormErrorMessage
                                formStateErrors={
                                    form.formState.errors.subscription
                                }
                                errors={errors.subscription}
                            />
                        </div>
                        <div
                            dir="ltr"
                            className="flex flex-row items-center justify-between gap-10 rounded-lg border p-4"
                        >
                            <div className="space-y-0.5 text-nowrap flex flex-col truncate">
                                <Label className="text-base">التامين</Label>
                                <span dir="rtl">200 دج سنويا</span>
                                <FormErrorMessage
                                    formStateErrors={
                                        form.formState.errors.insurance
                                    }
                                    errors={errors.insurance}
                                />
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
                            <FormErrorMessage
                                formStateErrors={form.formState.errors.picture}
                                errors={errors.picture}
                            />
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
                            <FormErrorMessage
                                formStateErrors={form.formState.errors.file}
                                errors={errors.file}
                            />
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
