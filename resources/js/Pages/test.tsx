import { Head, Link } from "@inertiajs/react";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/Components/ui/calendar";
import { format } from "date-fns";
import { Switch } from "@/Components/ui/switch";
import { Separator } from "@/Components/ui/separator";
const clubs = [
    { id: 1, name: "النادي الاول" },
    { id: 2, name: "النادي الثاني" },
    { id: 3, name: "النادي الثالث" },
    { id: 4, name: "النادي الرابع" },
];
const categories = [
    { id: 1, name: "الفئة 1" },
    { id: 2, name: "الفئة 2" },
    { id: 3, name: "الفئة 3" },
];

const FormSchema = z
    .object({
        club: z.enum(["1", "2", "3"], {
            required_error: "النادي مطلوب",
        }),
        firstName: z.string({
            required_error: "الاسم مطلوب",
        }),
        lastName: z.string({
            required_error: "اللقب مطلوب",
        }),
        gender: z
            .enum(["male", "female"], {
                required_error: "الجنس مطلوب",
            })
            .refine((val) => ["male", "female"].includes(val), {
                message: "الجنس يجب ان يكون ذكر او انثى",
            }),
        birthDate: z.date({
            required_error: "تاريخ الميلاد مطلوب",
        }),
        socialStatus: z
            .enum(["good", "mid", "low"], {
                required_error: "الحالة الاجتماعية مطلوبة",
            })
            .refine((val) => ["good", "mid", "low"].includes(val), {
                message: "الحالة العائلية يجب ان تكون جيدة او متوسطة او ضعيفة",
            }),
        hasCronicDisease: z.enum(["yes", "no"], {
            required_error: "هل يعاني من مرض مزمن مطلوب",
        }),
        cronicDisease: z.string().optional(),
        familyStatus: z.string().optional(),
        fatherJob: z.string({
            required_error: "وظيفة الاب مطلوبة",
        }),
        motherJob: z.string({
            required_error: "وظيفة الام مطلوبة",
        }),
        fatherPhone: z
            .union([
                z.string().regex(/^0[567]\d{8}$/, {
                    message: "يرجى ادخال رقم هاتف صحيح",
                }),
                z.literal(""),
            ])
            .optional(),
        motherPhone: z
            .union([
                z.string().regex(/^0[567]\d{8}$/, {
                    message: "يرجى ادخال رقم هاتف صحيح",
                }),
                z.literal(""),
            ])
            .optional(),
        category: z.enum(["1", "2", "3"], {
            required_error: "الفئة مطلوبة",
        }),
        subscription: z
            .string({ required_error: "الاشتراك الشهري مطلوب" })
            .regex(/^\d+$/, {
                message: "الاشتراك الشهري يجب ان يكون رقم",
            }),
        insurance: z.boolean({
            required_error: "التامين مطلوب",
        }),
    })
    .refine((data) => data.fatherPhone || data.motherPhone, {
        message: "يرجى ادخال رقم هاتف الاب او الام",
        path: ["fatherPhone", "motherPhone"], // This will highlight both fields in case of an error
    });
export default function Dashboard({ auth }: PageProps) {
    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
    });

    function onSubmit(data: z.infer<typeof FormSchema>) {
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    console.log(data );
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
                <h1 className="text-5xl font-bold text-gray-900">
                    تسجيل الطالب
                </h1>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 "
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
                        <div className="flex sm:flex-row flex-col gap-2 w-full">
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
                        <div className="flex sm:flex-row flex-col gap-2 w-full">
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
                        <div className="flex sm:flex-row flex-col gap-2 w-full">
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
                        <Separator className="h-1" />

                        <div className="flex sm:flex-row flex-col gap-2 w-full">
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
                        <div className="flex sm:flex-row flex-col gap-2 w-full">
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
                        <Separator className="h-1" />
                        <div className="flex sm:flex-row flex-col gap-2 w-full">
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
                        <div className="flex sm:flex-row flex-col gap-2 w-full"></div>
                        <Button type="submit">تسجيل</Button>
                    </form>
                </Form>
            </div>
        </DashboardLayout>
    );
}
