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
import { Link, useForm } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { Banknote, MoreHorizontal, Trash2, UserPen } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ThomanCircle from "./ThomanCircle";

export type StudentDisplay = {
    id: string;
    name: string;
    age: number;
    club: string;
    ahzab: number;
    ahzab_up: number;
    ahzab_down: number;
    category: string;
    category_gender?: "male" | "female";
    gender: "male" | "female";
    birthdate: Date;
    subscription: number;
    sessions_credit: number;
    insurance_expire_at: Date | null;
    subscription_expire_at: Date | null;
    last_hizb_attendance: any;
    last_thoman_attendance: any;
};

export const columns: ColumnDef<StudentDisplay>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected()
                        ? true
                        : table.getIsSomePageRowsSelected()
                        ? "indeterminate"
                        : false
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
                    checked={!!row.getIsSelected()}
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

    // {
    //     id: "الحزب",
    //     accessorKey: "ahzab",
    //     header: () => (
    //         <div className="flex justify-center cursor-pointer">الأحزاب</div>
    //     ),
    //     cell: ({ row }) => {
    //         const student = row.original;
    //         const { put, setData, errors } = useForm(student);
    //         console.log(errors);
    //         if (errors.ahzab_up || errors.ahzab_down) {
    //             toast.error("حدث خطأ أثناء تعديل الأحزاب", {
    //                 description: errors.ahzab_up || errors.ahzab_down,
    //             });
    //             errors.ahzab_up = "";
    //             errors.ahzab_down = "";
    //         }
    //         const [open, setOpen] = useState(false);

    //         // Use student.id in a key to force reset of state when ID changes
    //         const [ahzabUp, setAhzabUp] = useState(() => student.ahzab_up || 0);
    //         const [ahzabDown, setAhzabDown] = useState(
    //             () => student.ahzab_down || 0
    //         );

    //         // Reset form values when student ID changes
    //         useEffect(() => {
    //             setAhzabUp(student.ahzab_up || 0);
    //             setAhzabDown(student.ahzab_down || 0);
    //             // Also update the form data to match
    //             setData("ahzab_up", student.ahzab_up || 0);
    //             setData("ahzab_down", student.ahzab_down || 0);
    //         }, [student.id]); // This dependency ensures reset when student changes

    //         // Compute the sum automatically.
    //         const computedAhzab = Number(ahzabUp) + Number(ahzabDown);

    //         const handleConfirm = () => {
    //             put(`/students/ahzab/${student.id}`, {});
    //             setOpen(false);
    //         };

    //         return (
    //             <>
    //                 <div
    //                     onClick={() => setOpen(true)}
    //                     className="text-center font-medium cursor-pointer transition-colors hover:font-bold"
    //                 >
    //                     <span className="w-8 inline-block text-center p-1 rounded-lg bg-gray-100 ring-neutral-900 ring-1 font-mono">
    //                         {student.ahzab}
    //                     </span>
    //                 </div>
    //                 <Dialog open={open} onOpenChange={setOpen}>
    //                     <DialogContent dir="rtl">
    //                         <DialogHeader>
    //                             <DialogTitle>تعديل الأحزاب</DialogTitle>
    //                             <DialogDescription>
    //                                 قم بتعديل الأحزاب مع الأعلى والأسفل، وسيتم
    //                                 حساب المجموع تلقائيًا.
    //                             </DialogDescription>
    //                             <div className="flex flex-col gap-4 mt-4">
    //                                 <div>
    //                                     <label className="block text-sm font-medium">
    //                                         الأحزاب مع الأعلى
    //                                     </label>
    //                                     <input
    //                                         type="number"
    //                                         value={ahzabUp}
    //                                         onChange={(e) => {
    //                                             setData(
    //                                                 "ahzab_up",
    //                                                 Number(e.target.value)
    //                                             );
    //                                             setAhzabUp(
    //                                                 Number(e.target.value)
    //                                             );
    //                                         }}
    //                                         className="mt-1 block w-full border rounded p-1"
    //                                     />
    //                                 </div>
    //                                 <div>
    //                                     <label className="block text-sm font-medium">
    //                                         الأحزاب مع الأسفل
    //                                     </label>
    //                                     <input
    //                                         type="number"
    //                                         value={ahzabDown}
    //                                         onChange={(e) => {
    //                                             setData(
    //                                                 "ahzab_down",
    //                                                 Number(e.target.value)
    //                                             );
    //                                             setAhzabDown(
    //                                                 Number(e.target.value)
    //                                             );
    //                                         }}
    //                                         className="mt-1 block w-full border rounded p-1"
    //                                     />
    //                                 </div>
    //                                 <div>
    //                                     <label className="block text-sm font-medium">
    //                                         الأحزاب (المجموع)
    //                                     </label>
    //                                     <input
    //                                         type="number"
    //                                         value={computedAhzab}
    //                                         disabled
    //                                         className="mt-1 block w-full border rounded p-1 bg-gray-100"
    //                                     />
    //                                 </div>
    //                             </div>
    //                         </DialogHeader>
    //                         <DialogFooter className="flex justify-start gap-2">
    //                             <Button
    //                                 onClick={handleConfirm}
    //                                 variant="default"
    //                             >
    //                                 تأكيد
    //                             </Button>
    //                             <Button
    //                                 onClick={() => setOpen(false)}
    //                                 variant="secondary"
    //                                 className="ml-2"
    //                             >
    //                                 إلغاء
    //                             </Button>
    //                         </DialogFooter>
    //                     </DialogContent>
    //                 </Dialog>
    //             </>
    //         );
    //     },
    // },
    {
        id: "الحزب",
        accessorKey: "last_hizb_attendance.number",
        header: () => <div className="text-center">الحزب</div>,
        cell: ({ row }) => {
            const hizb = row.original.last_hizb_attendance;
            const thoman = row.original.last_thoman_attendance;
            const hizbNumber = hizb ? hizb.hizb.number : null;
            const thomanNumber = thoman ? thoman.thoman.number : 0;

            if (hizbNumber === null) {
                return (
                    <div className="text-center font-medium text-muted-foreground">
                        -
                    </div>
                );
            }

            return (
                <div className="flex items-center justify-center gap-2">
                    <ThomanCircle value={thomanNumber} size={22} />
                    <span className="font-medium tabular-nums">
                        {hizbNumber}
                    </span>
                </div>
            );
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
        id: "التأمين",
        accessorKey: "insurance_expire_at",
        header: () => <div className="text-center">التأمين</div>,
        cell: ({ row }) => {
            const insuranceString = row.getValue("التأمين") as string | null;
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
            const sessionsCredit = row.original.sessions_credit;

            // For exempt students (subscription=0), show credit balance
            if (subscriptionAmount === 0) {
                return (
                    <div className="flex justify-center font-medium">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-100 text-blue-700 border border-blue-200">
                            <span className="text-lg font-bold">∞</span>
                            <span className="text-xs">معفى</span>
                        </div>
                    </div>
                );
            }

            // For paying students, show credit with color coding
            const creditColor =
                sessionsCredit < 0
                    ? "bg-red-100 text-red-700 border-red-200"
                    : sessionsCredit < 4
                    ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200";

            return (
                <div className="flex justify-center font-medium">
                    <div className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${creditColor}`}
                        >
                            <span className="font-bold">{sessionsCredit}</span>
                            <span className="text-xs">حصة</span>
                        </div>
                        <div
                            className={`w-fit px-2 py-1 rounded-lg text-xs ${
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
