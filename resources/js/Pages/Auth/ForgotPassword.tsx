import { FormEventHandler } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { Head, Link, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm<{
        email: string;
    }>({
        email: "",
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route("password.email"));
    };

    return (
        <GuestLayout>
            <Head title="نسيت كلمة السر" />

            <h1 className="text-3xl font-bold text-gray-900 my-4">
                نسيت كلمة السر؟
            </h1>

            <p className="mb-4 text-sm text-gray-600 leading-6">
                لا داعي للقلق. أدخل بريدك الإلكتروني المسجّل وسنرسل لك رابطًا
                لإعادة تعيين كلمة السر.
            </p>

            {status && (
                <div className="mb-4 font-medium text-sm text-green-600">
                    {status}
                </div>
            )}

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
                        isFocused={true}
                        onChange={(e) => setData("email", e.target.value)}
                    />

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="mt-4">
                    <Button
                        className="rounded-full w-full flex justify-center items-center"
                        disabled={processing}
                    >
                        إرسال رابط إعادة التعيين
                    </Button>
                </div>

                <div className="flex items-center justify-center mt-4">
                    <Link
                        href={route("login")}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        العودة إلى تسجيل الدخول
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
