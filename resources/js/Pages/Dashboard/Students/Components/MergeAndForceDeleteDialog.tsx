import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import { Input } from "@/Components/ui/input";
import { ScrollArea } from "@/Components/ui/scroll-area";
import { PageProps } from "@/types";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { ArrowLeft, ArrowRight, Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Candidate = {
    id: number;
    first_name: string;
    last_name: string;
    gender: "male" | "female";
    birthdate: string | null;
    ahzab: number | null;
    subscription: number | null;
    subscription_expire_at: string | null;
    insurance_expire_at: string | null;
    club_name: string | null;
    category_name: string | null;
};

type DataDependencies = {
    categories: {
        id: number;
        name: string;
        students_count: number;
        gender: string | null;
    }[];
    clubs: { id: number; name: string; students_count: number }[];
    genders: { gender: string; total: number }[];
};

type StudentsPageProps = PageProps & {
    dataDependencies?: DataDependencies;
};

type ServerPayment = {
    id: number;
    type: "sub" | "ins";
    value: string | number;
    status: string;
    discount: string | number | null;
    start_at: string | null;
    end_at: string | null;
};

type DuplicatePayment = ServerPayment & { overlaps_canonical: boolean };

type MergePayload = {
    duplicate: {
        id: number;
        first_name: string;
        last_name: string;
        payments: DuplicatePayment[];
    };
    canonical: {
        id: number;
        first_name: string;
        last_name: string;
        payments: ServerPayment[];
    };
};

type Decision = "transfer" | "delete";

type Props = {
    student: {
        id: string | number;
        name: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const STATUS_LABELS: Record<string, string> = {
    in_time: "في الوقت",
    late: "متأخر",
    early: "مبكر",
};

function paymentTypeLabel(type: ServerPayment["type"]): string {
    return type === "ins" ? "تأمين" : "اشتراك";
}

function formatDateRange(start: string | null, end: string | null): string {
    if (!start && !end) return "—";
    const fmt = (s: string | null) =>
        s ? new Date(s.replace(" ", "T")).toLocaleDateString("ar") : "—";
    return `${fmt(start)} ← ${fmt(end)}`;
}

function ageFromBirthdate(birthdate: string | null): number | null {
    if (!birthdate) return null;
    const dob = new Date(birthdate);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age;
}

export default function MergeAndForceDeleteDialog({
    student,
    open,
    onOpenChange,
}: Props) {
    const { props } = usePage<StudentsPageProps>();
    const dataDependencies = props.dataDependencies;

    const [step, setStep] = useState<"pick" | "resolve" | "confirm">("pick");
    const [search, setSearch] = useState("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [searching, setSearching] = useState(false);
    const [genderFilter, setGenderFilter] = useState<string[]>([]);
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [clubFilter, setClubFilter] = useState<string[]>([]);
    const [canonical, setCanonical] = useState<Candidate | null>(null);
    const [payload, setPayload] = useState<MergePayload | null>(null);
    const [loadingPayload, setLoadingPayload] = useState(false);
    const [decisions, setDecisions] = useState<Record<number, Decision>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            setStep("pick");
            setSearch("");
            setCandidates([]);
            setGenderFilter([]);
            setCategoryFilter([]);
            setClubFilter([]);
            setCanonical(null);
            setPayload(null);
            setDecisions({});
            setSubmitting(false);
        }
    }, [open]);

    useEffect(() => {
        if (step !== "pick") return;
        const q = search.trim();
        if (q.length < 2) {
            setCandidates([]);
            return;
        }
        const handle = setTimeout(() => {
            setSearching(true);
            axios
                .get(route("students.mergeCandidates"), {
                    params: {
                        q,
                        exclude: student.id,
                        gender:
                            genderFilter.length > 0 ? genderFilter : undefined,
                        categories:
                            categoryFilter.length > 0
                                ? categoryFilter
                                : undefined,
                        clubs: clubFilter.length > 0 ? clubFilter : undefined,
                    },
                })
                .then((res) => setCandidates(res.data.candidates ?? []))
                .catch(() => toast.error("تعذر البحث عن الطلاب"))
                .finally(() => setSearching(false));
        }, 300);
        return () => clearTimeout(handle);
    }, [search, step, student.id, genderFilter, categoryFilter, clubFilter]);

    const toggleInArray = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        value: string
    ) =>
        setter((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value]
        );

    const genderTotals = useMemo(() => {
        const map: Record<string, number> = {};
        dataDependencies?.genders.forEach((g) => {
            map[g.gender] = g.total;
        });
        return map;
    }, [dataDependencies]);

    const pickCanonical = (candidate: Candidate) => {
        setCanonical(candidate);
        setLoadingPayload(true);
        axios
            .get(
                route("students.mergePayload", {
                    trashed: student.id,
                    canonical: candidate.id,
                })
            )
            .then((res) => {
                const data = res.data as MergePayload;
                setPayload(data);
                if (data.duplicate.payments.length === 0) {
                    setStep("confirm");
                } else {
                    setStep("resolve");
                }
            })
            .catch(() => toast.error("تعذر تحميل المدفوعات"))
            .finally(() => setLoadingPayload(false));
    };

    const allDecided = useMemo(() => {
        if (!payload) return false;
        return payload.duplicate.payments.every(
            (p) => decisions[p.id] !== undefined
        );
    }, [payload, decisions]);

    const counts = useMemo(() => {
        const transfer = Object.values(decisions).filter(
            (d) => d === "transfer"
        ).length;
        const del = Object.values(decisions).filter(
            (d) => d === "delete"
        ).length;
        return { transfer, delete: del };
    }, [decisions]);

    const submit = () => {
        if (!canonical || !payload) return;

        const transferIds = payload.duplicate.payments
            .filter((p) => decisions[p.id] === "transfer")
            .map((p) => p.id);
        const deleteIds = payload.duplicate.payments
            .filter((p) => decisions[p.id] === "delete")
            .map((p) => p.id);

        setSubmitting(true);
        router.post(
            route("students.mergeAndDelete", {
                trashed: student.id,
                canonical: canonical.id,
            }),
            {
                transfer_payment_ids: transferIds,
                delete_payment_ids: deleteIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error("تعذر إتمام عملية الدمج");
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent dir="rtl" className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        دمج وحذف نهائي للطالب: {student.name}
                    </DialogTitle>
                    <DialogDescription>
                        ابحث عن الطالب الأصلي، حدد ما يجب نقله أو حذفه من
                        مدفوعات الطالب المكرر، ثم أكد العملية.
                    </DialogDescription>
                </DialogHeader>

                {step === "pick" && (
                    <div className="space-y-3" dir="rtl">
                        <Input
                            dir="rtl"
                            placeholder="ابحث بالاسم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                        {dataDependencies && (
                            <div className="flex flex-wrap items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex gap-1"
                                        >
                                            <span>الجنس</span>
                                            <Badge className="px-1.5">
                                                {genderFilter.length}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuCheckboxItem
                                            dir="rtl"
                                            checked={genderFilter.includes(
                                                "male"
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleInArray(
                                                    setGenderFilter,
                                                    "male"
                                                );
                                            }}
                                        >
                                            الذكور ({genderTotals.male || 0})
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            dir="rtl"
                                            checked={genderFilter.includes(
                                                "female"
                                            )}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleInArray(
                                                    setGenderFilter,
                                                    "female"
                                                );
                                            }}
                                        >
                                            الاناث ({genderTotals.female || 0})
                                        </DropdownMenuCheckboxItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex gap-1"
                                        >
                                            <span>الفئة</span>
                                            <Badge className="px-1.5">
                                                {categoryFilter.length}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {dataDependencies.categories.map(
                                            (cat) => (
                                                <DropdownMenuCheckboxItem
                                                    dir="rtl"
                                                    key={cat.id}
                                                    checked={categoryFilter.includes(
                                                        cat.id.toString()
                                                    )}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        toggleInArray(
                                                            setCategoryFilter,
                                                            cat.id.toString()
                                                        );
                                                    }}
                                                >
                                                    <div className="flex w-full justify-between gap-2">
                                                        <span
                                                            className={
                                                                cat.gender ===
                                                                "male"
                                                                    ? "text-blue-500"
                                                                    : cat.gender ===
                                                                      "female"
                                                                    ? "text-pink-500"
                                                                    : ""
                                                            }
                                                        >
                                                            {cat.name}
                                                        </span>
                                                        <span>
                                                            ({cat.students_count})
                                                        </span>
                                                    </div>
                                                </DropdownMenuCheckboxItem>
                                            )
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex gap-1"
                                        >
                                            <span>النادي</span>
                                            <Badge className="px-1.5">
                                                {clubFilter.length}
                                            </Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {dataDependencies.clubs.map((club) => (
                                            <DropdownMenuCheckboxItem
                                                dir="rtl"
                                                key={club.id}
                                                checked={clubFilter.includes(
                                                    club.id.toString()
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggleInArray(
                                                        setClubFilter,
                                                        club.id.toString()
                                                    );
                                                }}
                                            >
                                                <div className="flex w-full justify-between gap-2">
                                                    <span>{club.name}</span>
                                                    <span>
                                                        ({club.students_count})
                                                    </span>
                                                </div>
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                {(genderFilter.length > 0 ||
                                    categoryFilter.length > 0 ||
                                    clubFilter.length > 0) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setGenderFilter([]);
                                            setCategoryFilter([]);
                                            setClubFilter([]);
                                        }}
                                    >
                                        مسح الفلاتر
                                    </Button>
                                )}
                            </div>
                        )}
                        <ScrollArea className="h-80 rounded-md border">
                            <div className="divide-y" dir="rtl">
                                {searching && (
                                    <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        جاري البحث...
                                    </div>
                                )}
                                {!searching &&
                                    search.trim().length < 2 && (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            اكتب حرفين على الأقل لبدء البحث.
                                        </div>
                                    )}
                                {!searching &&
                                    search.trim().length >= 2 &&
                                    candidates.length === 0 && (
                                        <div className="p-4 text-sm text-muted-foreground">
                                            لا توجد نتائج.
                                        </div>
                                    )}
                                {candidates.map((c) => {
                                    const age = ageFromBirthdate(c.birthdate);
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            className="flex w-full items-center justify-between gap-3 p-3 text-start hover:bg-muted disabled:opacity-50"
                                            onClick={() => pickCanonical(c)}
                                            disabled={loadingPayload}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`truncate font-medium ${
                                                            c.gender === "male"
                                                                ? "text-blue-600"
                                                                : "text-pink-600"
                                                        }`}
                                                    >
                                                        {c.first_name}{" "}
                                                        {c.last_name}
                                                    </span>
                                                    {age !== null && (
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {age} سنة
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    {c.club_name && (
                                                        <span>
                                                            <span className="font-semibold">
                                                                النادي:
                                                            </span>{" "}
                                                            {c.club_name}
                                                        </span>
                                                    )}
                                                    {c.category_name && (
                                                        <span>
                                                            <span className="font-semibold">
                                                                الفئة:
                                                            </span>{" "}
                                                            {c.category_name}
                                                        </span>
                                                    )}
                                                    {c.birthdate && (
                                                        <span>
                                                            <span className="font-semibold">
                                                                الميلاد:
                                                            </span>{" "}
                                                            {c.birthdate}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                    {c.ahzab !== null && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {c.ahzab} حزب
                                                        </Badge>
                                                    )}
                                                    {c.subscription !==
                                                        null && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            اشتراك:{" "}
                                                            {c.subscription} د.ج
                                                        </Badge>
                                                    )}
                                                    {c.subscription_expire_at && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            ينتهي:{" "}
                                                            {
                                                                c.subscription_expire_at
                                                            }
                                                        </Badge>
                                                    )}
                                                    {c.insurance_expire_at && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            تأمين:{" "}
                                                            {
                                                                c.insurance_expire_at
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {loadingPayload && (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {step === "resolve" && payload && canonical && (
                    <div className="space-y-3" dir="rtl">
                        <div
                            className="flex items-center justify-between text-sm"
                            dir="rtl"
                        >
                            <span>
                                المكرر:{" "}
                                <strong>
                                    {payload.duplicate.first_name}{" "}
                                    {payload.duplicate.last_name}
                                </strong>
                            </span>
                            <span>
                                الأصلي:{" "}
                                <strong>
                                    {payload.canonical.first_name}{" "}
                                    {payload.canonical.last_name}
                                </strong>
                            </span>
                        </div>
                        <ScrollArea className="h-96 rounded-md border">
                            <div
                                className="grid grid-cols-2 gap-px bg-border"
                                dir="rtl"
                            >
                                <div className="bg-background p-3">
                                    <div className="mb-2 text-sm font-semibold text-red-600">
                                        مدفوعات المكرر
                                    </div>
                                    <div className="space-y-2">
                                        {payload.duplicate.payments.map(
                                            (p) => (
                                                <div
                                                    key={p.id}
                                                    className={`rounded-md border p-2 text-sm ${
                                                        p.overlaps_canonical
                                                            ? "border-e-4 border-amber-500 bg-amber-50"
                                                            : ""
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">
                                                            {paymentTypeLabel(
                                                                p.type
                                                            )}
                                                        </span>
                                                        <span>
                                                            {p.value} د.ج
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {STATUS_LABELS[
                                                            p.status
                                                        ] ?? p.status}{" "}
                                                        ·{" "}
                                                        {formatDateRange(
                                                            p.start_at,
                                                            p.end_at
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex gap-2">
                                                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border p-1 text-xs hover:bg-emerald-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-100">
                                                            <input
                                                                type="radio"
                                                                name={`decision-${p.id}`}
                                                                className="sr-only"
                                                                checked={
                                                                    decisions[
                                                                        p.id
                                                                    ] ===
                                                                    "transfer"
                                                                }
                                                                onChange={() =>
                                                                    setDecisions(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [p.id]: "transfer",
                                                                        })
                                                                    )
                                                                }
                                                            />
                                                            نقل إلى الأصلي
                                                            <ArrowLeft className="h-3 w-3" />
                                                        </label>
                                                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded border p-1 text-xs hover:bg-red-50 has-[:checked]:border-red-500 has-[:checked]:bg-red-100">
                                                            <input
                                                                type="radio"
                                                                name={`decision-${p.id}`}
                                                                className="sr-only"
                                                                checked={
                                                                    decisions[
                                                                        p.id
                                                                    ] ===
                                                                    "delete"
                                                                }
                                                                onChange={() =>
                                                                    setDecisions(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [p.id]: "delete",
                                                                        })
                                                                    )
                                                                }
                                                            />
                                                            <Trash2 className="h-3 w-3" />
                                                            حذف
                                                        </label>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                                <div className="bg-background p-3">
                                    <div className="mb-2 text-sm font-semibold text-emerald-700">
                                        مدفوعات الأصلي (للقراءة)
                                    </div>
                                    <div className="space-y-2">
                                        {payload.canonical.payments.length ===
                                            0 && (
                                            <div className="text-xs text-muted-foreground">
                                                لا توجد مدفوعات.
                                            </div>
                                        )}
                                        {payload.canonical.payments.map(
                                            (p) => (
                                                <div
                                                    key={p.id}
                                                    className="rounded-md border p-2 text-sm opacity-90"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium">
                                                            {paymentTypeLabel(
                                                                p.type
                                                            )}
                                                        </span>
                                                        <span>
                                                            {p.value} د.ج
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {STATUS_LABELS[
                                                            p.status
                                                        ] ?? p.status}{" "}
                                                        ·{" "}
                                                        {formatDateRange(
                                                            p.start_at,
                                                            p.end_at
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {step === "confirm" && canonical && (
                    <div className="space-y-2 text-sm" dir="rtl">
                        <p>
                            سيتم نقل <strong>{counts.transfer}</strong> دفعة
                            إلى{" "}
                            <strong>
                                {canonical.first_name} {canonical.last_name}
                            </strong>
                            ، وحذف <strong>{counts.delete}</strong> دفعة، ثم
                            حذف الطالب المكرر نهائياً.
                        </p>
                        <p className="text-muted-foreground">
                            لا يمكن التراجع عن هذه العملية.
                        </p>
                    </div>
                )}

                <DialogFooter dir="rtl" className="gap-2 sm:justify-between">
                    <div>
                        {step !== "pick" && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                    if (step === "confirm") {
                                        setStep(
                                            payload &&
                                                payload.duplicate.payments
                                                    .length > 0
                                                ? "resolve"
                                                : "pick"
                                        );
                                    } else {
                                        setStep("pick");
                                        setCanonical(null);
                                        setPayload(null);
                                        setDecisions({});
                                    }
                                }}
                                disabled={submitting}
                            >
                                <ArrowRight className="h-4 w-4" />
                                رجوع
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {step === "resolve" && (
                            <Button
                                type="button"
                                onClick={() => setStep("confirm")}
                                disabled={!allDecided}
                            >
                                متابعة
                            </Button>
                        )}
                        {step === "confirm" && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={submit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                                دمج وحذف نهائي
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
