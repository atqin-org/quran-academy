import { Link, Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import Guest from "@/Layouts/GuestLayout";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/Components/ui/pagination";
import { Button } from "@/Components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Label } from "@/Components/ui/label";
import { Input } from "@/Components/ui/input";
import { router } from "@inertiajs/react";
import React from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import Dropzone from "@/Components/costume-cn/Dropzone";
import { Switch } from "@/Components/ui/switch";
export default function Index({
    auth,
    laravelVersion,
    phpVersion,
    form,
}: PageProps<{ laravelVersion: string; phpVersion: string; form: TForm }>) {
    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        router.post(route("forms.store"), data);
    }
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Register" />
            <div className="flex flex-col gap-10">
                <h1 className="text-4xl font-bold text-gray-900">
                    تسجيل فورم جديد
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                    <div className="flex flex-wrap ">
                        {form.fields?.map((field, index) => {
                            let fieldElement;

                            switch (field.type) {
                                case "text":
                                    fieldElement = (
                                        <div
                                            key={index}
                                            className="p-4"
                                            style={{ width: `${field.width}%` }}
                                        >
                                            <Label htmlFor={field.label}>
                                                {field.label}
                                            </Label>
                                            <Input
                                                className="w-full"
                                                placeholder={field.label}
                                                dir="rtl"
                                                name={field.name}
                                                id={field.label}
                                            />
                                        </div>
                                    );
                                    break;
                                case "select":
                                    const options: string[] = field.options
                                        ? JSON.parse(field.options)
                                        : [];

                                    fieldElement = (
                                        <div
                                            key={index}
                                            className="p-4"
                                            style={{ width: `${field.width}%` }}
                                        >
                                            <Label htmlFor={field.label}>
                                                {field.label}
                                            </Label>
                                            <Select
                                                defaultValue={options[0]}
                                                dir="rtl"
                                                name={field.name}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue
                                                        placeholder={
                                                            field.label
                                                        }
                                                    />
                                                </SelectTrigger>
                                                <SelectContent className="w-full">
                                                    {options.map(
                                                        (option, index) => (
                                                            <SelectItem
                                                                key={index}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </SelectItem>
                                                        )
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                    break;
                                // Add more cases here for other field types, like 'radio', etc.
                                case "date":
                                    fieldElement = (
                                        <div
                                            key={index}
                                            className="p-4"
                                            style={{ width: `${field.width}%` }}
                                        >
                                            <Label className=" w-full">
                                                {field.label}
                                            </Label>
                                            <Input
                                                type="date"
                                                readOnly={false}
                                                name={field.name}
                                                id={field.name}
                                                dir="rtl"
                                            />
                                        </div>
                                    );
                                    break;
                                case "file":
                                    fieldElement = (
                                        <div
                                            key={index}
                                            className="p-4"
                                            style={{ width: `${field.width}%` }}
                                        >
                                            <Label className=" w-full">
                                                {field.label}
                                            </Label>
                                            <Dropzone />
                                        </div>
                                    );
                                    break;
                                case "switch":
                                    fieldElement = (
                                        <div
                                            key={index}
                                            className="p-4"
                                            style={{ width: `${field.width}%` }}
                                        >
                                           

                                            <div
                                                dir="ltr"
                                                className={`flex flex-row items-center justify-between gap-10 rounded-lg border p-4`}
                                            >
                                                <div className="space-y-0.5 text-nowrap flex flex-col truncate">
                                                    <Label className="text-base">
                                                        التامين
                                                    </Label>
                                                    <span dir="rtl">
                                                        200 دج سنويا
                                                    </span>
                                                    
                                                </div>
                                                <Switch
                                                     id={field.name}
                                                     name={field.name}
                                                />
                                            </div>
                                        </div>
                                    );
                                    break;
                                default:
                                    fieldElement = null; // Or a fallback component
                            }

                            return fieldElement;
                        })}
                    </div>

                    <Button type="submit">تسجيل</Button>
                </form>
            </div>
        </DashboardLayout>
    );
}
