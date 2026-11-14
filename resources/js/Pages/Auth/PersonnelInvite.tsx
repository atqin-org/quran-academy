import { FormEventHandler, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PasswordStrength, { isPasswordValid } from "@/Components/PasswordStrength";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface Props {
    token: string;
    name: string;
    email: string;
    expires_at: string;
}

export default function PersonnelInvite({ token, name, email, expires_at }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        password: string;
        password_confirmation: string;
    }>({
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const isValid = isPasswordValid(data.password, data.password_confirmation);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route("personnel-invite.store", { token }), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const expiresAtLabel = new Date(expires_at).toLocaleDateString("ar-DZ", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <GuestLayout>
            <Head title="تفعيل الحساب" />

            <h1 className="text-3xl font-bold text-gray-900 my-4">تفعيل الحساب</h1>

            <p className="mb-2 text-sm text-gray-600 leading-6">
                مرحباً <span className="font-semibold">{name}</span>،
            </p>
            <p className="mb-4 text-sm text-gray-600 leading-6">
                اختر كلمة المرور الخاصة بحسابك على البريد <span dir="ltr" className="font-medium">{email}</span>.
                صلاحية هذا الرابط تنتهي في {expiresAtLabel}.
            </p>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="password" value="كلمة المرور" />
                    <div className="relative">
                        <TextInput
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full pe-10"
                            autoComplete="new-password"
                            isFocused={true}
                            onChange={(e) => setData("password", e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password_confirmation" value="تأكيد كلمة المرور" />
                    <TextInput
                        id="password_confirmation"
                        type={showPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) => setData("password_confirmation", e.target.value)}
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <PasswordStrength
                    password={data.password}
                    confirmation={data.password_confirmation}
                />

                <div className="mt-6">
                    <Button
                        className="rounded-full w-full flex justify-center items-center"
                        disabled={processing || !isValid}
                    >
                        تفعيل الحساب
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
