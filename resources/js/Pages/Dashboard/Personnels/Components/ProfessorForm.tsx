import Dropzone from "@/Components/costume-cn/Dropzone";
import FileUploaded from "@/Components/costume-cn/FileUploaded";
import FormErrorMessage from "@/Components/costume-cn/FormErrorMessage";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { FormSchema } from "@/Data/Zod/Students";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TPersonnelForm } from "../Types/Personnel";

interface PersonnelFormProps {
    data: TPersonnelForm;
    setData: (key: string, value: any) => void;
    errors: any; //Partial<Record<keyof TStudentForm, string>>;
    clubs: { id: number; name: string }[];
    processing: boolean;
    mode: "create" | "edit";
    studentId?: string;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}
const roles = [
    { id: 1, name: "معلم", value: "teacher" },
    { id: 2, name: "مساعد", value: "staff" },
    { id: 3, name: "مشرف", value: "moderator" },
]
const PersonnelForm = ({
    data,
    setData,
    errors,
    clubs,
    processing,
    studentId,
    handleSubmit,
}: PersonnelFormProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDialogOpen = () => {
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
                            const res = await axios.post("/api/guardian", {
                                id: studentId || null,
                            });
                            handleSubmit(e);
                            resolve("تم التسجيل بنجاح");
                        } catch (error) {
                            //handleDialogOpen();
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
        if (isDialogOpen) {
            handleDialogOpen();
        } else {
            //handleSubmit(e);
        }
    };
    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
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
                            {roles.map((role: any) => (
                                <SelectItem
                                    key={role.id}
                                    value={role.id.toString()}
                                >
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
