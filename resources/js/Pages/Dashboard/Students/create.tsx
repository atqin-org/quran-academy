import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Button } from "@/Components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/Components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Input } from "@/Components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { CalendarIcon, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/Components/ui/calendar";
import { format } from "date-fns";
import { Switch } from "@/Components/ui/switch";
import Dropzone, { DropzoneState } from "@/Components/costume-cn/Dropzone";
import { FormSchema } from "@/Data/Zod/Students";
interface DashboardProps extends PageProps {
    clubs: { id: number; name: string }[];
    categories: { id: number; name: string }[];
}

export default function Dashboard({ auth, clubs, categories }: DashboardProps) {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    console.log(data);
                    resolve("");
                }, 500);
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
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <Button
                            type="submit"
                            variant="default"
                            className="w-fit"
                        >
                            تسجيل
                        </Button>
                        <FormField
                            name="club"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>النادي</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        dir="rtl"
                                    >
                                        <FormControl
                                            className={
                                                field.value
                                                    ? ""
                                                    : "text-slate-500"
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر نادي" />
                                            </SelectTrigger>
                                        </FormControl>
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
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="firstName"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>الاسم</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب الاسم ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="lastName"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>اللقب</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب اللقب ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="gender"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>الجنس</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            dir="rtl"
                                        >
                                            <FormControl
                                                className={
                                                    field.value
                                                        ? ""
                                                        : "text-slate-500"
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر الجنس ..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem
                                                    key={0}
                                                    value={"male"}
                                                >
                                                    {"ذكر"}
                                                </SelectItem>
                                                <SelectItem
                                                    key={1}
                                                    value={"female"}
                                                >
                                                    {"انثى"}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="birthDate"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className=" w-full">
                                        <FormLabel className=" w-full">
                                            تاريخ الميلاد
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            " flex justify-between w-full pl-3 font-normal",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "yyyy/MM/dd"
                                                            )
                                                        ) : (
                                                            <span>
                                                                اليوم / الشهر /
                                                                السنة
                                                            </span>
                                                        )}
                                                        <CalendarIcon className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    defaultMonth={field.value}
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    fromYear={1900}
                                                    toYear={new Date().getFullYear()}
                                                    fixedWeeks
                                                    captionLayout="dropdown-buttons"
                                                    disabled={(date) =>
                                                        date > new Date() ||
                                                        date <
                                                            new Date(
                                                                "1900-01-01"
                                                            )
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="socialStatus"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>الحالة الاجتماعية</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            dir="rtl"
                                        >
                                            <FormControl
                                                className={
                                                    field.value
                                                        ? ""
                                                        : "text-slate-500"
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر الحالة الاجتماعية ..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem
                                                    key="good"
                                                    value="good"
                                                >
                                                    {"ميسورة"}
                                                </SelectItem>
                                                <SelectItem
                                                    key="mid"
                                                    value="mid"
                                                >
                                                    {"متوسطة"}
                                                </SelectItem>
                                                <SelectItem
                                                    key="low"
                                                    value="low"
                                                >
                                                    {"معوزة"}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="hasCronicDisease"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>
                                            هل يعاني من مرض مزمن؟
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            dir="rtl"
                                        >
                                            <FormControl
                                                className={
                                                    field.value
                                                        ? ""
                                                        : "text-slate-500"
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر ..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem
                                                    key="yes"
                                                    value="yes"
                                                >
                                                    {"نعم"}
                                                </SelectItem>
                                                <SelectItem key="no" value="no">
                                                    {"لا"}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.watch("hasCronicDisease") === "yes" && (
                                <FormField
                                    name="cronicDisease"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>ماهو المرض؟</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="اكتب ..."
                                                    dir="rtl"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                        <FormField
                            name="familyStatus"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>الحالة العائلية</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="اكتب ملاحظات عن الحالة العائلية ان وجدت ..."
                                            dir="rtl"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="fatherJob"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>وظيفة الاب</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="fatherPhone"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>رقم هاتف الاب</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="motherJob"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>وظيفة الام</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="motherPhone"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>رقم هاتف الام</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="category"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>الفئة</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            dir="rtl"
                                        >
                                            <FormControl
                                                className={
                                                    field.value
                                                        ? ""
                                                        : "text-slate-500"
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر الفئة ..." />
                                                </SelectTrigger>
                                            </FormControl>
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="subscription"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>الاشتراك الشهري</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="اكتب ..."
                                                dir="rtl"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="insurance"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem
                                        dir="ltr"
                                        className="flex flex-row items-center justify-between gap-10 rounded-lg border p-4"
                                    >
                                        <div className="space-y-0.5 text-nowrap">
                                            <FormLabel className="text-base">
                                                التامين
                                            </FormLabel>
                                            <FormDescription dir="rtl">
                                                200 دج سنويا
                                            </FormDescription>
                                            <FormMessage />
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex sm:flex-row flex-col gap-6 w-full">
                            <FormField
                                name="picture"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>الصورة الشخصية</FormLabel>
                                        <FormControl>
                                            <Dropzone {...field}>
                                                {(dropzone: DropzoneState) => (
                                                    <div className=" flex flex-col items-center justify-center">
                                                        <CloudUpload className="h-12 w-12 text-gray-400" />
                                                        <span className="text-md font-semibold text-gray-400">
                                                            {dropzone.isDragAccept
                                                                ? "ضع الملفات هنا"
                                                                : "اضغط او اسحب الملفات هنا"}
                                                        </span>
                                                        <span className="mt-0.5 text-sm font-medium text-gray-400">
                                                            الملفات المقبولة:
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-400">
                                                            jpg, png, jpeg, pdf
                                                        </span>
                                                    </div>
                                                )}
                                            </Dropzone>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                name="file"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>شهادة الميلاد</FormLabel>
                                        <FormControl>
                                            <Dropzone {...field}>
                                                {(dropzone: DropzoneState) => (
                                                    <div className=" flex flex-col items-center justify-center">
                                                        <CloudUpload className="h-12 w-12 text-gray-400" />
                                                        <span className="text-md font-semibold text-gray-400">
                                                            {dropzone.isDragAccept
                                                                ? "ضع الملفات هنا"
                                                                : "اضغط او اسحب الملفات هنا"}
                                                        </span>
                                                        <span className="mt-0.5 text-sm font-medium text-gray-400">
                                                            الملفات المقبولة:
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-400">
                                                            jpg, png, jpeg, pdf
                                                        </span>
                                                    </div>
                                                )}
                                            </Dropzone>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit">تسجيل</Button>
                    </form>
                </Form>
            </div>
        </DashboardLayout>
    );
}
