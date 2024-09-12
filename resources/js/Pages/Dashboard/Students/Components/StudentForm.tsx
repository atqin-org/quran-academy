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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Switch } from "@/Components/ui/switch";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import FormErrorMessage from "@/Components/costume-cn/FormErrorMessage";
import { TStudentForm } from "../Types/Student";
import axios from "axios";
import { useForm } from "react-hook-form";
import { FormSchema } from "@/Data/Zod/Students";
import { zodResolver } from "@hookform/resolvers/zod";

interface StudentFormProps {
    data: TStudentForm;
    setData: (key: string, value: any) => void;
    errors: any; //Partial<Record<keyof TStudentForm, string>>;
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string; gender?: "male" | "female" }[];
    processing: boolean;
    mode: "create" | "edit";
    studentId?: string;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}
interface GuardianFormProps {
    "father.name"?: string;
    "father.job"?: string;
    "father.phone"?: string;
    "mother.name"?: string;
    "mother.job"?: string;
    "mother.phone"?: string;
}
const StudentForm = ({
    data,
    setData,
    errors,
    clubs,
    categories,
    processing,
    mode,
    studentId,
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDialogOpen = () => {
        // Simulate an DialogOpen
        setIsDialogOpen(!isDialogOpen);
    };
    const [dialogConfig, setDialogConfig] = useState({
        title: "",
        description: "",
        confirm: "",
        cancel: "",
    });
    const form = useForm({
        resolver: zodResolver(FormSchema),
        defaultValues: data,
    });

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        form.setValue("firstName", data.firstName);
        form.setValue("lastName", data.lastName);
        form.setValue("gender", data.gender);
        form.setValue("birthdate", data.birthdate);
        form.setValue("socialStatus", data.socialStatus);
        form.setValue("hasCronicDisease", data.hasCronicDisease);
        form.setValue("cronicDisease", data.cronicDisease);
        form.setValue("familyStatus", data.familyStatus);
        form.setValue("father.name", data.father?.name);
        form.setValue("mother.name", data.mother?.name);
        form.setValue("father.job", data.father?.job);
        form.setValue("father.phone", data.father?.phone);
        form.setValue("mother.job", data.mother?.job);
        form.setValue("mother.phone", data.mother?.phone);
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
                            const res = await axios.post("/guardian", {
                                father: data.father,
                                mother: data.mother,
                                id: studentId || null,
                            });
                            setDialogConfig(
                                res.data.dialog ?? {
                                    title: "",
                                    description: "",
                                    confirm: "",
                                    cancel: "",
                                }
                            );

                            console.log(res);
                            if (res.data.status_code === "300") {
                                //console.log("submit placeholder");
                                handleSubmit(e);
                                resolve("تم التسجيل بنجاح");
                            } else {
                                handleDialogOpen();
                                resolve("تم التسجيل بنجاح");
                            }
                        } catch (error) {
                            handleDialogOpen();
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
        if (isDialogOpen) {
            handleDialogOpen();
        } else {
            //handleSubmit(e);
        }
    };
    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
                {/*
                <button type="button" onClick={handleDialogOpen}>
                    Simulate DialogOpen
                </button>
                */}

                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{dialogConfig.title}</DialogTitle>
                            <DialogDescription>
                                {dialogConfig.description}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex gap-2">
                            <Button
                                onClick={handleDialogOpen}
                                variant="secondary"
                            >
                                {dialogConfig.cancel}
                            </Button>
                            <Button onClick={() => handleSubmit}>
                                {dialogConfig.confirm}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
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
                    <Label>اسم الاب</Label>
                    <Input
                        value={data.father?.name}
                        onChange={(e) =>
                            setData("father", {
                                ...data.father,
                                name: e.target.value,
                            })
                        }
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.father?.name}
                        errors={errors["father.name"]}
                    />
                </div>
                <div className="w-full">
                    <Label>وظيفة الاب</Label>
                    <Input
                        value={data.father?.job}
                        onChange={(e) =>
                            setData("father", {
                                ...data.father,
                                job: e.target.value,
                            })
                        }
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.father?.job}
                        errors={errors["father.job"]}
                    />
                </div>
                <div className="w-full">
                    <Label>رقم هاتف الاب</Label>
                    <Input
                        value={data.father?.phone}
                        onChange={(e) =>
                            setData("father", {
                                ...data.father,
                                phone: e.target.value,
                            })
                        }
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.father?.phone}
                        errors={errors["father.phone"]}
                    />
                </div>
            </div>
            <div className="flex sm:flex-row flex-col gap-6 w-full">
                <div className="w-full">
                    <Label>اسم الام</Label>
                    <Input
                        value={data.mother?.name}
                        onChange={(e) =>
                            setData("mother", {
                                ...data.mother,
                                name: e.target.value,
                            })
                        }
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.mother?.name}
                        errors={errors["mother.name"]}
                    />
                </div>
                <div className="w-full">
                    <Label>وظيفة الام</Label>
                    <Input
                        value={data.mother?.job}
                        onChange={(e) =>
                            setData("mother", {
                                ...data.mother,
                                job: e.target.value,
                            })
                        }
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.mother?.job}
                        errors={errors["mother.job"]}
                    />
                </div>
                <div className="w-full">
                    <Label>رقم هاتف الام</Label>
                    <Input
                        value={data.mother?.phone}
                        onChange={(e) =>
                            setData("mother", {
                                ...data.mother,
                                phone: e.target.value,
                            })
                        }
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.mother?.phone}
                        errors={errors["mother.phone"]}
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
                                    {category.name}{" "}
                                    {category.gender == "male"
                                        ? "(ذكور)"
                                        : category.gender == "female"
                                        ? "(اناث)"
                                        : ""}
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
