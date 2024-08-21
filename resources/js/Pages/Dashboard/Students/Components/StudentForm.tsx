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
import { cn } from "@/lib/utils";
import {  UseFormReturn } from "react-hook-form";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import FormErrorMessage from "@/Components/costume-cn/FormErrorMessage";
import { TStudentForm } from "../Types/Student";

interface StudentFormProps {
    data: TStudentForm;
    setData: (key: string, value: any) => void;
    errors: Partial<Record<keyof TStudentForm, string>>;
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string ,gender?: "male" | "female"}[];
    processing: boolean;
    form: UseFormReturn<TStudentForm, any, undefined>;
    mode: "create" | "edit";
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const StudentForm = ({
    data,
    setData,
    errors,
    clubs,
    categories,
    processing,
    form,
    mode,
    handleSubmit,
}: StudentFormProps) => {
    const [tmpDate, setTmpDate] = useState<string>(
        data.birthdate?.toString() || ""
    );

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTmpDate(e.target.value);
    };

    const handleDateBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let tmp = tmpDate.replace(/-/g, "/");
        if (tmp.length === 8) {
            const day = tmp.substring(0, 2);
            const month = tmp.substring(2, 4);
            const year = tmp.substring(4, 8);
            tmp = day + "/" + month + "/" + year;
        }
        const parsedDate = parse(tmp, "dd/MM/yyyy", new Date());
        if (tmpDate === "") {
            setData("birthdate", undefined);
        } else if (!isNaN(parsedDate.getTime())) {
            setData("birthdate", parsedDate);
        } else {
            setData("birthdate", undefined);
            toast.error("تاريخ غير صالح " + tmp);
        }
        setTmpDate(data.birthdate?.toString() || "");
    };
    return (
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
                        className={data.club ? "" : "text-neutral-500"}
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
                        onChange={(e) => setData("firstName", e.target.value)}
                        placeholder="اكتب الاسم ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.firstName}
                        errors={errors.firstName}
                    />
                </div>
                <div className="w-full">
                    <Label>اللقب</Label>
                    <Input
                        value={data.lastName}
                        onChange={(e) => setData("lastName", e.target.value)}
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
                        onValueChange={(value) => setData("gender", value)}
                        defaultValue={data.gender}
                        dir="rtl"
                    >
                        <SelectTrigger
                            className={data.gender ? "" : "text-neutral-500"}
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
                    <div className="flex gap-1">
                        <Input
                            value={
                                tmpDate && tmpDate.length <= 10
                                    ? tmpDate
                                    : data.birthdate
                                    ? format(data.birthdate, "dd/MM/yyyy")
                                    : ""
                            }
                            readOnly={false}
                            onChange={handleDateChange}
                            onBlur={handleDateBlur}
                            placeholder="اليوم / الشهر / السنة"
                            dir="rtl"
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    type="button"
                                    className={cn(
                                        " flex justify-between w-fit font-normal",
                                        !data.birthdate &&
                                            "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="h-4 w-4" />
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
                    </div>
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.birthdate}
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
                                data.socialStatus ? "" : "text-neutral-500"
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
                        formStateErrors={form.formState.errors.socialStatus}
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
                                data.hasCronicDisease ? "" : "text-neutral-500"
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
                        formStateErrors={form.formState.errors.hasCronicDisease}
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
                    onChange={(e) => setData("familyStatus", e.target.value)}
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
                        onChange={(e) => setData("fatherJob", e.target.value)}
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.fatherJob}
                        errors={errors.fatherJob}
                    />
                </div>
                <div className="w-full">
                    <Label>رقم هاتف الاب</Label>
                    <Input
                        value={data.fatherPhone}
                        onChange={(e) => setData("fatherPhone", e.target.value)}
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.fatherPhone}
                        errors={errors.fatherPhone}
                    />
                </div>
            </div>
            <div className="flex sm:flex-row flex-col gap-6 w-full">
                <div className="w-full">
                    <Label>وظيفة الام</Label>
                    <Input
                        value={data.motherJob}
                        onChange={(e) => setData("motherJob", e.target.value)}
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.motherJob}
                        errors={errors.motherJob}
                    />
                </div>
                <div className="w-full">
                    <Label>رقم هاتف الام</Label>
                    <Input
                        value={data.motherPhone}
                        onChange={(e) => setData("motherPhone", e.target.value)}
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.motherPhone}
                        errors={errors.motherPhone}
                    />
                </div>
            </div>
            <div className="flex sm:flex-row flex-col gap-6 w-full">
                <div className="w-full">
                    <Label>الفئة</Label>
                    <Select
                        onValueChange={(value) => setData("category", value)}
                        defaultValue={data.category}
                        dir="rtl"
                    >
                        <SelectTrigger
                            className={data.category ? "" : "text-neutral-500"}
                        >
                            <SelectValue placeholder="اختر الفئة ..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
                                >
                                    {category.name} {category.gender == "male" ? "(ذكور)" : category.gender == "female" ? "(اناث)" : ""}
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
                        formStateErrors={form.formState.errors.subscription}
                        errors={errors.subscription}
                    />
                </div>
                <div
                    dir="ltr"
                    className={`flex flex-row items-center justify-between gap-10 rounded-lg border p-4 ${
                        mode === "edit" ? "hidden" : ""
                    }`}
                >
                    <div className="space-y-0.5 text-nowrap flex flex-col truncate">
                        <Label className="text-base">التامين</Label>
                        <span dir="rtl">200 دج سنويا</span>
                        <FormErrorMessage
                            formStateErrors={form.formState.errors.insurance}
                            errors={errors.insurance}
                        />
                    </div>
                    <Switch
                        checked={data.insurance}
                        onCheckedChange={(value) => setData("insurance", value)}
                    />
                </div>
            </div>
            <div className="flex sm:flex-row flex-col gap-6 w-full">
                <div className="w-full">
                    <Label>الصورة الشخصية</Label>
                    {data.picture === undefined || data.picture == null ? (
                        <Dropzone
                            onDrop={(acceptedFiles) => {
                                if (data.picture || acceptedFiles.length > 0) {
                                    setData("picture", acceptedFiles[0]);
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
                    {data.file === undefined || data.file == null ? (
                        <Dropzone
                            onDrop={(acceptedFiles) => {
                                if (data.file || acceptedFiles.length > 0) {
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
    );
};

export default StudentForm;
