import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import AvatarPicker from "@/Components/costume-cn/AvatarPicker";
import { Link, useForm, usePage } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FormEventHandler } from "react";
import {
    AvatarStyle,
    BoringVariant,
    HashvatarMode,
    HashvatarTones,
    PageProps,
} from "@/types";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = "",
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage<PageProps>().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            last_name: user.last_name,
            phone: user.phone,
            email: user.email,
            avatar_style: (user.avatar_style ?? "initials") as AvatarStyle,
            avatar_color: user.avatar_color ?? null,
            avatar_variant: (user.avatar_variant ?? null) as BoringVariant | null,
            hashvatar_mode: (user.hashvatar_mode ?? null) as HashvatarMode | null,
            hashvatar_animated: !!user.hashvatar_animated,
            hashvatar_tones: (user.hashvatar_tones ?? null) as HashvatarTones | null,
        });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route("profile.update"));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    المعلومات الشخصية
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    تحديث معلومات الحساب والبريد الإلكتروني.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <AvatarPicker
                            user={{
                                name: data.name,
                                last_name: data.last_name,
                            }}
                            style={data.avatar_style}
                            color={data.avatar_color}
                            variant={data.avatar_variant}
                            hashvatarMode={data.hashvatar_mode}
                            hashvatarAnimated={data.hashvatar_animated}
                            hashvatarTones={data.hashvatar_tones}
                            onChange={(next) => {
                                Object.entries(next).forEach(([k, v]) =>
                                    setData(k as keyof typeof data, v as never),
                                );
                            }}
                        />
                    </div>

                    <div className="space-y-5 lg:col-span-3">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <InputLabel htmlFor="name" value="الاسم" />
                                <TextInput
                                    id="name"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                    isFocused
                                    autoComplete="name"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>
                            <div>
                                <InputLabel htmlFor="last_name" value="اللقب" />
                                <TextInput
                                    id="last_name"
                                    className="mt-1 block w-full"
                                    value={data.last_name}
                                    onChange={(e) =>
                                        setData("last_name", e.target.value)
                                    }
                                    required
                                    autoComplete="last_name"
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.last_name}
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="رقم الهاتف" />
                            <TextInput
                                id="phone"
                                type="tel"
                                inputMode="tel"
                                placeholder="0555123456"
                                className="mt-1 block w-full text-right"
                                value={data.phone}
                                onChange={(e) =>
                                    setData("phone", e.target.value)
                                }
                                required
                                autoComplete="tel"
                            />
                            <InputError
                                className="mt-2"
                                message={errors.phone}
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="email"
                                value="البريد الإلكتروني"
                            />
                            <TextInput
                                id="email"
                                type="email"
                                className="mt-1 block w-full text-right"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                required
                                autoComplete="username"
                            />
                            <InputError
                                className="mt-2"
                                message={errors.email}
                            />
                        </div>

                        {mustVerifyEmail && user.email_verified_at === null && (
                            <div>
                                <p className="text-sm mt-2 text-gray-800">
                                    Your email address is unverified.
                                    <Link
                                        href={route("verification.send")}
                                        method="post"
                                        as="button"
                                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Click here to re-send the verification
                                        email.
                                    </Link>
                                </p>

                                {status === "verification-link-sent" && (
                                    <div className="mt-2 font-medium text-sm text-green-600">
                                        A new verification link has been sent
                                        to your email address.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-2">
                            <PrimaryButton disabled={processing}>
                                حفظ
                            </PrimaryButton>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-gray-600">
                                    تم الحفظ بنجاح.
                                </p>
                            </Transition>
                        </div>
                    </div>
                </div>
            </form>
        </section>
    );
}
