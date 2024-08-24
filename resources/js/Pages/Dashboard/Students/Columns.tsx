import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/Components/ui/checkbox";
import { Button } from "@/Components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
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
                    href={`/dashboard/students/${row.original.id}`}
                    className="text-start font-medium hover:underline hover:underline-offset-2"
                >
                    {name}
                </Link>
            );
        },
    },
    {
        id: "العمر",
        accessorKey: "age",
        header: ({ column }) => {
            return (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                        className="flex justify-start items-center gap-1"
                    >
                        العمر
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const age = row.getValue("العمر") as number;
            return <div className="text-center font-medium">{age}</div>;
        },
    },
    {
        id: "الحزب",
        accessorKey: "ahzab",
        header: ({ column }) => {
            return (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        onClick={() =>
                            column.toggleSorting(column.getIsSorted() === "asc")
                        }
                        className="flex items-center gap-1"
                    >
                        الاحزاب
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            );
        },
        cell: ({ row }) => {
            const ahzab = row.getValue("الحزب") as number;
            return <div className="text-center font-medium">{ahzab}</div>;
        },
    },
    {
        id: "النادي",
        accessorKey: "club",
        header: () => <div className="text-start">النادي</div>,
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
                    className={`text-start font-medium ${
                        category_color
                    }`}
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
            const isDatePassed = insurance ? new Date() > insurance : false;
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
            const subscriptionString = row.getValue("الاشتراك") as
                | string
                | null;
            const subscription = subscriptionString
                ? new Date(subscriptionString)
                : null;
            const isDatePassed = subscription
                ? new Date() > subscription
                : false;
            return (
                <div className="flex justify-center font-medium">
                    <div
                        className={`w-fit p-2 rounded-xl ${
                            isDatePassed
                                ? "bg-red-200 text-red-700"
                                : "bg-emerald-200 text-emerald-700"
                        }`}
                    >
                        {subscription
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
                <DropdownMenu dir="rtl">
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>المزيد</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() =>
                                navigator.clipboard.writeText(student.id)
                            }
                        >
                            نسخ رقم الطالب
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <Link
                                href={`/dashboard/students/${student.id}/edit`}
                            >
                                تعديل
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link href={`/dashboard/students/`}>الدفع</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Link
                                href={`/dashboard/students/${student.id}/delete`}
                            >
                                حذف
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
    },
];
