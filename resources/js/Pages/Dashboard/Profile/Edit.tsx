import DashboardLayout from "@/Layouts/DashboardLayout";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import { Head } from "@inertiajs/react";
import { PageProps } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { LockKeyhole, User } from "lucide-react";

export default function Edit({
    auth,
    mustVerifyEmail,
    status,
}: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <DashboardLayout user={auth.user}>
            <Head title="Profile" />
            <div className="pb-12 pt-2">
                <div className="max-w-7xl flex flex-col items-center sm:px-6 lg:px-8 space-y-6">
                    <Tabs
                        defaultValue="profile"
                        className="w-full flex flex-col items-center "
                        dir="rtl"
                    >
                        <TabsList className="w-[200px] md:w-[400px] grid grid-cols-3">
                            <TabsTrigger
                                value="profile"
                                className="flex gap-1 items-center "
                            >
                                <span className="hidden md:inline-block">الحساب</span>
                                <User className="size-4" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="password"
                                className="flex gap-1 items-center "
                            >
                                <span className="hidden md:inline-block">كلمة المرور</span>
                                <LockKeyhole className="size-4" />
                            </TabsTrigger>
                            <TabsTrigger
                                value="delete"
                                className="flex gap-1 items-center "
                            >
                                <span className="hidden md:inline-block">حذف الحساب</span>
                                <LockKeyhole className="size-4" />
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="profile" className="w-full">
                            <div className="p-4 sm:p-8 bg-white w-full shadow sm:rounded-lg">
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                    className="max-w-xl"
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="password" className="w-full">
                            <div className="p-4 sm:p-8 bg-white w-full shadow sm:rounded-lg">
                                <UpdatePasswordForm className="max-w-xl" />
                            </div>
                        </TabsContent>
                        <TabsContent value="delete" className="w-full">
                            <div className="p-4 sm:p-8 bg-white w-full shadow sm:rounded-lg">
                                <DeleteUserForm className="max-w-xl" />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
