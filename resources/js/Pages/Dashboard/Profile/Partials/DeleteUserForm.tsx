import { useRef, useState, FormEventHandler } from "react";
import DangerButton from "@/Components/DangerButton";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { useForm } from "@inertiajs/react";

export default function DeleteUserForm({
    className = "",
}: {
    className?: string;
}) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: "",
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser: FormEventHandler = (e) => {
        e.preventDefault();

        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    حذف الحساب
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    بمجرد حذف حسابك، سيتم حذف جميع موارده وبياناته بشكل نهائي.
                    قبل حذف حسابك، يرجى تنزيل أي بيانات أو معلومات ترغب في
                    الاحتفاظ بها.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>
                حذف الحساب
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900">
                        هل أنت متأكد من رغبتك في حذف حسابك؟
                    </h2>

                    <p className="mt-1 text-sm text-gray-600">
                        بمجرد حذف حسابك، سيتم حذف جميع موارده و والبيانات الخاصة
                        به سيتم حذفها نهائيًا. يرجى إدخال كلمة المرور الخاصة بك
                        لتأكيد رغبتك في حذف حسابك بشكل دائم حسابك نهائياً.
                    </p>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="كلمة المرور"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData("password", e.target.value)
                            }
                            className="mt-1 block w-3/4"
                            isFocused
                            placeholder="كلمة المرور"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex justify-start">
                        <SecondaryButton onClick={closeModal}>
                            الغاء
                        </SecondaryButton>

                        <DangerButton className="ms-3" disabled={processing}>
                            حذف الحساب
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
