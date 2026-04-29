import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";

export default function ResetPassword({
    token,
    email,
}: {
    token: string;
    email: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm<{
        token: string;
        email: string;
        password: string;
        password_confirmation: string;
    }>({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("password.store"), {
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="إعادة تعيين كلمة السر" />

            <h1 className="text-3xl font-bold text-gray-900 my-4">
                إعادة تعيين كلمة السر
            </h1>

            <p className="mb-4 text-sm text-gray-600 leading-6">
                اختر كلمة سر جديدة لحسابك.
            </p>

            <form onSubmit={submit}>
                <div>
                    <InputLabel htmlFor="email" value="بريد الكتروني" />

                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 block w-full"
                        autoComplete="username"
                        onChange={(e) => setData("email", e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel htmlFor="password" value="كلمة السر الجديدة" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        isFocused={true}
                        onChange={(e) => setData("password", e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="mt-4">
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="تأكيد كلمة السر"
                    />

                    <TextInput
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="mt-6">
                    <Button
                        className="rounded-full w-full flex justify-center items-center"
                        disabled={processing}
                    >
                        تعيين كلمة السر
                    </Button>
                </div>
            </form>
        </GuestLayout>
    );
}
