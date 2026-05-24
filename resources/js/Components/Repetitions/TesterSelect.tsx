import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendeeOption, CurrentUserOption } from "./types";

interface Props {
    value: { tester_user_id: number | null; tester_student_id: number | null };
    onChange: (next: { tester_user_id: number | null; tester_student_id: number | null }) => void;
    currentUser: CurrentUserOption;
    attendees: AttendeeOption[];
    excludeStudentId: number;
    disabled?: boolean;
}

export default function TesterSelect({
    value,
    onChange,
    currentUser,
    attendees,
    excludeStudentId,
    disabled,
}: Props) {
    const filteredAttendees = attendees.filter((a) => a.id !== excludeStudentId);

    const selectValue =
        value.tester_user_id !== null
            ? `u:${value.tester_user_id}`
            : value.tester_student_id !== null
                ? `s:${value.tester_student_id}`
                : "";

    return (
        <Select
            value={selectValue}
            onValueChange={(v) => {
                if (v.startsWith("u:")) {
                    onChange({ tester_user_id: Number(v.slice(2)), tester_student_id: null });
                } else if (v.startsWith("s:")) {
                    onChange({ tester_user_id: null, tester_student_id: Number(v.slice(2)) });
                } else {
                    onChange({ tester_user_id: null, tester_student_id: null });
                }
            }}
            disabled={disabled}
            dir="rtl"
        >
            <SelectTrigger className="h-9">
                <SelectValue placeholder="إختر..." />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>المسؤول</SelectLabel>
                    <SelectItem value={`u:${currentUser.id}`}>
                        <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">مشرف</Badge>
                            <span>{currentUser.name}</span>
                        </span>
                    </SelectItem>
                </SelectGroup>
                {filteredAttendees.length > 0 && (
                    <SelectGroup>
                        <SelectLabel>الطلاب الحاضرون</SelectLabel>
                        {filteredAttendees.map((a) => (
                            <SelectItem key={a.id} value={`s:${a.id}`}>
                                <span className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px]">طالب</Badge>
                                    <span className={cn(a.is_deleted && "text-muted-foreground line-through")}>
                                        {a.first_name} {a.last_name}
                                    </span>
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )}
            </SelectContent>
        </Select>
    );
}
