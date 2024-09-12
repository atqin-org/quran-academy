import { Button } from "@/Components/ui/button";
import { Checkbox } from "@/Components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/Components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, MoreHorizontal, Trash2, UserPen } from "lucide-react";

import { Link } from "@inertiajs/react";

export type StudentDisplay = {
    id: string;
    name: string;
    age: number;
    club: string;
    ahzab: number;
    category: string;
    category_gender?: "male" | "female";
    gender: "male" | "female";
    birthdate: Date;
    subscription: number;
    insurance_expire_at: Date | null;
    subscription_expire_at: Date | null;
};

export const columns: ColumnDef<StudentDisplay>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <div className="mx-auto flex items-center justify-end">
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            </div>
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "الاسم",
        accessorKey: "name",
        header: () => <div className="text-start">الاسم الكامل</div>,
        cell: ({ row }) => {
            const name = row.getValue("الاسم") as string;
            return (
                <Link
                    href={`/students/${row.original.id}`}
                    className="text-nowrap max-w-fit text-start font-medium hover:underline hover:underline-offset-2"
                >
                    {name}
                </Link>
            );
        },
    },
    {
        id: "العمر",
        accessorKey: "age",
        header: () => {
            return <div className="flex justify-center">العمر</div>;
        },
        cell: ({ row }) => {
            const age = row.getValue("العمر") as number;
            return <div className="text-center font-medium">{age}</div>;
        },
    },
    {
        id: "الحزب",
        accessorKey: "ahzab",
        header: () => {
            return <div className="flex justify-center">الاحزاب</div>;
        },
        cell: ({ row }) => {
            const ahzab = row.getValue("الحزب") as number;
            return <div className="text-center font-medium">{ahzab}</div>;
        },
    },
    {
        id: "الجنس",
        accessorKey: "gender",
        header: () => <div className="text-center">الجنس</div>,
        cell: ({ row }) => {
            const genderOption = true;
            const labelText =
                (row.getValue("الجنس") as string) === "male" ? "ذكر" : "أنثى";
            const color =
                (row.getValue("الجنس") as string) === "male"
                    ? "text-blue-500"
                    : "text-pink-500";
            return genderOption ? (
                <div className={`text-center font-medium ${color}`}>
                    {labelText}
                </div>
            ) : null;
        },
    },
    {
        id: "النادي",
        accessorKey: "club",
        header: () => <div className="text-start">النادي</div>,
        cell: ({ row }) => {
            const club = row.getValue("النادي") as string;
            return (
                <div className="text-nowrap text-start font-medium">{club}</div>
            );
        },
    },
    {
        id: "الفئة",
        accessorKey: "category",
        header: () => <div className="text-start">الفئة</div>,
        cell: ({ row }) => {
            const category = row.getValue("الفئة") as string;
            const category_gender = row.original.category_gender as string;
            const category_color =
                category_gender === "male"
                    ? "text-blue-500"
                    : category_gender === "female"
                    ? "text-pink-500"
                    : "text-black";
            return (
                <div
                    className={`text-nowrap text-start font-medium ${category_color}`}
                >
                    {category}
                </div>
            );
        },
    },
    {
        id: "التامين",
        accessorKey: "insurance_expire_at",
        header: () => <div className="text-center">التامين</div>,
        cell: ({ row }) => {
            const insuranceString = row.getValue("التامين") as string | null;
            const insurance = insuranceString
                ? new Date(insuranceString)
                : null;
            const isDatePassed = insurance
                ? new Date() > insurance
                : false || insurance === null;
            return (
                <div className="flex justify-center font-medium">
                    <div
                        className={`w-fit p-2 rounded-xl ${
                            isDatePassed
                                ? "bg-red-200 text-red-700"
                                : "bg-emerald-200 text-emerald-700"
                        }`}
                    >
                        {insurance
                            ? new Intl.DateTimeFormat("ar-DZ", {
                                  month: "2-digit",
                                  day: "2-digit",
                              }).format(insurance)
                            : "N/A"}
                    </div>
                </div>
            );
        },
    },
    {
        id: "الاشتراك",
        accessorKey: "subscription_expire_at",
        header: () => <div className="text-center">الاشتراك</div>,
        cell: ({ row }) => {
            const subscriptionAmount = parseFloat(
                row.getValue("مبلغ الاشتراك")
            );
            const subscriptionString = row.getValue("الاشتراك") as
                | string
                | null;
            const subscription = subscriptionString
                ? new Date(subscriptionString)
                : null;
            const isDatePassed = subscription
                ? new Date() > subscription
                : false || subscription === null;
            return (
                <div className="flex justify-center font-medium">
                    <div
                        className={`w-fit p-2 rounded-xl ${
                            isDatePassed && subscriptionAmount !== 0
                                ? "bg-red-200 text-red-700"
                                : "bg-emerald-200 text-emerald-700"
                        }`}
                    >
                        {subscriptionAmount === 0
                            ? "معفى"
                            : subscription
                            ? new Intl.DateTimeFormat("ar-DZ", {
                                  month: "2-digit",
                                  day: "2-digit",
                              }).format(subscription)
                            : "N/A"}
                    </div>
                </div>
            );
        },
    },
    {
        id: "مبلغ الاشتراك",
        accessorKey: "subscription",
        header: () => <div className="text-start">الاشتراك الشهري</div>,
        cell: ({ row }) => {
            const subscription = parseFloat(row.getValue("مبلغ الاشتراك"));
            const formatted = new Intl.NumberFormat("ar-DZ", {
                style: "currency",
                currency: "DZD",
            }).format(subscription);

            return <div className="text-start font-medium">{formatted}</div>;
        },
    },
    {
        id: "المزيد",
        header: () => <div className="text-start">المزيد</div>,
        cell: ({ row }) => {
            const student = row.original;
            return (
                <Dialog>
                    <DropdownMenu dir="rtl">
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="p-0 m-0">
                                <Link
                                    className="w-full px-4 flex items-center gap-2 rounded-md my-0.5"
                                    href={`/students/${student.id}/edit`}
                                    as="button"
                                >
                                    <UserPen />
                                    <span className="w-full">تعديل</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-0 m-0">
                                <Link
                                    className="w-full px-4 flex items-center gap-2 rounded-md my-0.5"
                                    href={`/students/${student.id}/payment`}
                                    as="button"
                                >
                                    <Banknote />
                                    <span className="w-full">الدفع</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="p-0 m-0">
                                <DialogTrigger asChild>
                                    <div className="w-full cursor-pointer px-4 flex items-center gap-2 hover:bg-red-200 rounded-md my-0.5">
                                        <Trash2 />
                                        <span className="w-full text-center">
                                            حذف
                                        </span>
                                    </div>
                                </DialogTrigger>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                هل انت متأكد من حذف هذا الطالب؟
                            </DialogTitle>
                            <DialogDescription>
                                لا يمكن التراجع عن هذا القرار وسيتم تسجيلك كحذف
                                للطالب
                            </DialogDescription>
                            <DialogFooter>
                                <Link
                                    className="px-4 flex items-center gap-2 rounded-md my-0.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    href={`/students/${student.id}`}
                                    method="delete"
                                    preserveState={false}
                                    as="button"
                                >
                                    <Trash2 />
                                    <span className="w-full">حذف</span>
                                </Link>
                            </DialogFooter>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            );
        },
    },
];
