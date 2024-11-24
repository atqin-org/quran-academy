'use client';

import Dropzone from "@/Components/costume-cn/Dropzone";
import FileUploaded from "@/Components/costume-cn/FileUploaded";
import FormErrorMessage from "@/Components/costume-cn/FormErrorMessage";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { FormSchemaP } from "@/Data/Zod/Personnels";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TPersonnelForm } from "../Types/Personnel";
import { Badge } from '@/Components/ui/badge';
import { Command, CommandGroup, CommandItem, CommandList } from '@/Components/ui/command';
import { X } from 'lucide-react';

interface PersonnelFormProps {
    data: TPersonnelForm;
    setData: (key: string, value: any) => void;
    errors: any;
    clubs: { id: number; name: string }[];
    categories?: { id: number; name: string }[]; // Added categories as optional
    processing: boolean;
    mode: "create" | "edit";
    personnelId?: string;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const roles = [
    { id: 1, name: "معلم", value: "teacher" },
    { id: 2, name: "مساعد", value: "staff" },
    { id: 3, name: "مشرف", value: "moderator" },
];

const PersonnelForm = ({
    data,
    setData,
    errors,
    clubs,
    categories, // Accept categories as a prop
    processing,
    personnelId,
    handleSubmit,
}: PersonnelFormProps) => {
    const form = useForm({
        resolver: zodResolver(FormSchemaP),
        defaultValues: data,
    });

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        form.setValue("firstName", data.firstName);
        form.setValue("lastName", data.lastName);
        form.setValue("mail", data.mail);
        form.setValue("phone", data.phone);
        form.setValue("club", data.club);
        form.setValue("role", data.role);
        form.setValue("card", data.card);

        form.trigger().then((isValid) => {
            if (isValid) {
                toast.promise(
                    new Promise(async (resolve, reject) => {
                        try {
                            handleSubmit(e);
                            resolve("تم التسجيل بنجاح");
                        } catch (error) {
                            console.log(error);
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
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">

            {/* Form Fields */}
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
                    <Label>البريد الإلكتروني</Label>
                    <Input
                        value={data.mail}
                        onChange={(e) => setData("mail", e.target.value)}
                        placeholder="اكتب البريد الإلكتروني ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.mail}
                        errors={errors.mail}
                    />
                </div>
            </div>

            {/* Remaining Fields */}
            <div className="flex sm:flex-row flex-col gap-6 w-full">
                <div className="w-full">
                    <Label>رقم الهاتف</Label>
                    <Input
                        value={data.phone}
                        onChange={(e) => setData("phone", e.target.value)}
                        placeholder="اكتب ..."
                        dir="rtl"
                    />
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.phone}
                        errors={errors.phone}
                    />
                </div>
                <div className="w-full">
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
                            {clubs.map((club: any) => (
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
                <div className="w-full">
                    <label className="block mb-2 text-sm font-medium text-gray-700">الدور</label>

                    <div className="relative">
                        <Command className="w-full border rounded-md">
                            <CommandList>
                                <CommandGroup>
                                    {roles.map((role) => (
                                        <CommandItem
                                            key={role.id}
                                            onSelect={() => handleRoleToggle(role.value)}
                                            className={selectedRoles.includes(role.value) ? "bg-gray-100" : ""}
                                        >
                                            {role.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>

                    {/* Selected roles badges */}
                    <div className="flex flex-wrap mt-2 gap-2">
                        {selectedRoles.map((role) => (
                            <Badge key={role} className="flex items-center gap-1">
                                {roles.find((r) => r.value === role)?.name}
                                <X
                                    className="cursor-pointer w-4 h-4"
                                    onClick={() => handleRoleToggle(role)}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>

            {/* Card Field */}
            <div className="w-full">
                <Label>بطاقة التعريف</Label>
                {data.card === undefined || data.card == null ? (
                    <Dropzone
                        onDrop={(acceptedFiles) => {
                            if (data.card || acceptedFiles.length > 0) {
                                setData("card", acceptedFiles[0]);
                            }
                        }}
                    />
                ) : (
                    <FileUploaded
                        file={data.card}
                        setData={setData}
                        name="card"
                    />
                )}
                <FormErrorMessage
                    formStateErrors={form.formState.errors.card}
                    errors={errors.card}
                />
            </div>

            <Button type="submit" disabled={processing}>
                حفظ المعلومات
            </Button>
        </form>
    );
};

export default PersonnelForm;
