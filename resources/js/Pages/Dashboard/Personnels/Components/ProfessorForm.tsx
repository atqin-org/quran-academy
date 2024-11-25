"use client";

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
import { Badge } from "@/Components/ui/badge";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput,
} from "@/Components/ui/command";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

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

                    <div className="relative">
                        <button
                            type="button"
                            className="w-full border rounded-md px-3 py-2 text-start bg-white"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {selectedClubs.length > 0 ? (
                                <div className="flex flex-wrap mt-1 gap-2">
                                    {selectedClubs.map((clubId) => (
                                        <Badge
                                            key={clubId}
                                            className="flex items-center gap-1"
                                        >
                                            {
                                                clubs.find(
                                                    (club) => club.id === clubId
                                                )?.name
                                            }
                                            <X
                                                className="cursor-pointer w-4 h-4"
                                                onClick={() =>
                                                    handleClubToggle(clubId)
                                                }
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-muted-foreground">
                                    اختر النادي...
                                </span>
                            )}
                        </button>
                        {isOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                                <Command>
                                    <CommandInput
                                        dir="rtl"
                                        placeholder="ابحث عن النادي ..."
                                        value={searchTerm}
                                        onValueChange={setSearchTerm}
                                    />
                                    <CommandList>
                                        <CommandGroup>
                                            {filteredClubs.map((club) => (
                                                <CommandItem
                                                    key={club.id}
                                                    onSelect={() => {
                                                        handleClubToggle(
                                                            club.id
                                                        );
                                                        setIsOpen(false);
                                                    }}
                                                    className={
                                                        selectedClubs.includes(
                                                            club.id
                                                        )
                                                            ? "bg-gray-100"
                                                            : ""
                                                    }
                                                >
                                                    {club.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-full">
                    <Label>الدور</Label>
                    <Select
                        onValueChange={(value) => setData("role", value)}
                        defaultValue={data.role}
                        dir="rtl"
                    >
                        <SelectTrigger
                            className={data.role ? "" : "text-neutral-500"}
                        >
                            <SelectValue placeholder="اختر الدور" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role.id} value={role.value}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormErrorMessage
                        formStateErrors={form.formState.errors.role}
                        errors={errors.role}
                    />
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
