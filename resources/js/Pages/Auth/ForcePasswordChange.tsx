import { FormEventHandler, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PasswordStrength, { isPasswordValid } from "@/Components/PasswordStrength";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function ForcePasswordChange() {
    const { data, setData, put, processing, errors, reset } = useForm<{
        current_password: string;
        password: string;
        password_confirmation: string;
    }>({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const isValid =
        data.current_password.length > 0 &&
        data.current_password !== data.password &&
        isPasswordValid(data.password, data.password_confirmation);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route("force-password.update"), {
            onFinish: () => reset("current_password", "password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="تحديث كلمة المرور" />

            <h1 className="text-3xl font-bold text-gray-900 my-4">تحديث كلمة المرور</h1>

            <p className="mb-4 text-sm text-gray-600 leading-6">
                لأسباب أمنية، يجب تحديث كلمة المرور قبل المتابعة إلى حسابك.
            </p>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="current_password" value="كلمة المرور الحالية" />
                    <TextInput
                        id="current_password"
                        type="password"
                        name="current_password"
                        value={data.current_password}
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                        isFocused={true}
                        onChange={(e) => setData("current_password", e.target.value)}
                    />
                    <InputError message={errors.current_password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="كلمة المرور الجديدة" />
                    <div className="relative">
                        <TextInput
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full pe-10"
                            autoComplete="new-password"
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

                <div className="mt-6 flex items-center justify-between gap-4">
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                        تسجيل الخروج
                    </Link>
                    <Button
                        className="rounded-full flex-1 flex justify-center items-center"
                        disabled={processing || !isValid}
                    >
                        حفظ كلمة المرور
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
