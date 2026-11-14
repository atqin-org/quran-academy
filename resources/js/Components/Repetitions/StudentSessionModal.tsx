import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { ScrollArea } from "@/Components/ui/scroll-area";
import MemorizationForm from "./MemorizationForm";
import RepetitionsForm from "./RepetitionsForm";
import type {
    AttendeeOption,
    CurrentUserOption,
    HizbOption,
    IncomingRepetitionSection,
    Rating,
    ThomanOption,
} from "./types";

interface StudentForModal {
    id: number;
    first_name: string;
    last_name: string;
    attendance_status: string;
    hizb_id: number | null;
    thoman_id: number | null;
    memorization_rating: Rating | null;
    memorization_remark: string | null;
    last_hizb_ascending: number | null;
    last_hizb_descending: number | null;
    repetitions: IncomingRepetitionSection[];
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab: "memorization" | "repetitions";
    sessionId: number;
    student: StudentForModal;
    ahzab: HizbOption[];
    athman: ThomanOption[];
    attendees: AttendeeOption[];
    currentUser: CurrentUserOption;
}

export default function StudentSessionModal({
    open,
    onOpenChange,
    defaultTab,
    sessionId,
    student,
    ahzab,
    athman,
    attendees,
    currentUser,
}: Props) {
    const [tab, setTab] = useState<"memorization" | "repetitions">(defaultTab);

    useEffect(() => {
        if (open) {
            setTab(defaultTab);
        }
    }, [open, defaultTab]);

    const close = () => onOpenChange(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl gap-0 p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="text-center text-base">تسجيل الحفظ والتكرار</DialogTitle>
                    <p className="text-center text-xs text-muted-foreground">
                        {student.first_name} {student.last_name}
                    </p>
                </DialogHeader>

                <Tabs
                    value={tab}
                    onValueChange={(v) => setTab(v as "memorization" | "repetitions")}
                    className="flex flex-col"
                    dir="rtl"
                >
                    <div className="flex justify-center border-b px-6 py-3">
                        <TabsList>
                            <TabsTrigger value="repetitions">تكرار</TabsTrigger>
                            <TabsTrigger value="memorization">حفظ</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="max-h-[70vh]" dir="rtl">
                        <div className="px-6 py-4" dir="rtl">
                            <TabsContent value="memorization" className="mt-0">
                                <MemorizationForm
                                    sessionId={sessionId}
                                    studentId={student.id}
                                    initial={{
                                        status: student.attendance_status,
                                        hizb_id: student.hizb_id,
                                        thoman_id: student.thoman_id,
                                        memorization_rating: student.memorization_rating,
                                        memorization_remark: student.memorization_remark,
                                    }}
                                    ahzab={ahzab}
                                    athman={athman}
                                    onSaved={close}
                                    onCancel={close}
                                />
                            </TabsContent>
                            <TabsContent value="repetitions" className="mt-0">
                                <RepetitionsForm
                                    sessionId={sessionId}
                                    studentId={student.id}
                                    initialSections={student.repetitions}
                                    ahzab={ahzab}
                                    athman={athman}
                                    attendees={attendees}
                                    currentUser={currentUser}
                                    lastHizbAscending={student.last_hizb_ascending}
                                    lastHizbDescending={student.last_hizb_descending}
                                    onSaved={close}
                                    onCancel={close}
                                />
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
