import {
    AvatarStyle,
    BoringVariant,
    HashvatarMode,
    HashvatarTones,
    TUser,
} from "@/types";
import { cn } from "@/lib/utils";
import Avatar from "./Avatar";

interface AvatarPickerProps {
    user: Pick<TUser, "name" | "last_name">;
    style: AvatarStyle;
    color: string | null;
    variant: BoringVariant | null;
    hashvatarMode: HashvatarMode | null;
    hashvatarAnimated: boolean;
    hashvatarTones: HashvatarTones | null;
    onChange: (next: Partial<{
        avatar_style: AvatarStyle;
        avatar_color: string | null;
        avatar_variant: BoringVariant | null;
        hashvatar_mode: HashvatarMode | null;
        hashvatar_animated: boolean;
        hashvatar_tones: HashvatarTones | null;
    }>) => void;
}

const styleTabs: { value: AvatarStyle; label: string }[] = [
    { value: "initials", label: "الأحرف الأولى" },
    { value: "hashvatar", label: "هاش" },
    { value: "boring", label: "ملوّن" },
];

const colorSwatches: string[] = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#fde68a",
    "#bbf7d0",
    "#bae6fd",
    "#e5e7eb",
    "#000000",
];

const boringVariants: BoringVariant[] = [
    "beam",
    "marble",
    "pixel",
    "sunset",
    "ring",
    "bauhaus",
];

const boringVariantLabel: Record<BoringVariant, string> = {
    beam: "Beam",
    marble: "Marble",
    pixel: "Pixel",
    sunset: "Sunset",
    ring: "Ring",
    bauhaus: "Bauhaus",
};

const hashvatarModes: { value: HashvatarMode; label: string }[] = [
    { value: "gradient", label: "تدرّج" },
    { value: "dither", label: "نقاط" },
];

const hashvatarTonesList: { value: HashvatarTones; label: string }[] = [
    { value: "auto", label: "تلقائي" },
    { value: "ocean", label: "محيط" },
    { value: "sunset", label: "غروب" },
    { value: "forest", label: "غابة" },
    { value: "candy", label: "حلوى" },
    { value: "warm", label: "دافئ" },
    { value: "mono", label: "أحادي" },
];

const AvatarPicker: React.FC<AvatarPickerProps> = ({
    user,
    style,
    color,
    variant,
    hashvatarMode,
    hashvatarAnimated,
    hashvatarTones,
    onChange,
}) => {
    const setStyle = (s: AvatarStyle) =>
        onChange({
            avatar_style: s,
            avatar_color: s === "initials" ? color : null,
            avatar_variant: s === "boring" ? variant ?? "beam" : null,
            hashvatar_mode: s === "hashvatar" ? hashvatarMode ?? "gradient" : null,
            hashvatar_animated: s === "hashvatar" ? hashvatarAnimated : false,
            hashvatar_tones: s === "hashvatar" ? hashvatarTones ?? "auto" : null,
        });

    const previewUser = {
        ...user,
        avatar_style: style,
        avatar_color: color,
        avatar_variant: variant,
        hashvatar_mode: hashvatarMode,
        hashvatar_animated: hashvatarAnimated,
        hashvatar_tones: hashvatarTones,
    };

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-6">
                <Avatar user={previewUser} size="xl" />

                <div className="flex-1 w-full space-y-4">
                    <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                            نمط الصورة الرمزية
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {styleTabs.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setStyle(t.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm border transition-colors",
                                        style === t.value
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {style === "initials" && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-900">
                                    اللون
                                </p>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onChange({ avatar_color: null })
                                    }
                                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                                >
                                    تلقائي
                                </button>
                            </div>
                            <div className="grid grid-cols-10 gap-1.5">
                                {colorSwatches.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        title={c}
                                        onClick={() =>
                                            onChange({ avatar_color: c })
                                        }
                                        style={{ backgroundColor: c }}
                                        className={cn(
                                            "w-7 h-7 rounded-full border-2 transition-transform",
                                            color === c
                                                ? "border-gray-900 scale-110"
                                                : "border-white hover:scale-105",
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {style === "boring" && (
                        <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">
                                النمط
                            </p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                                {boringVariants.map((v) => {
                                    const active = (variant ?? "beam") === v;
                                    return (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() =>
                                                onChange({ avatar_variant: v })
                                            }
                                            className={cn(
                                                "flex flex-col items-center gap-1 rounded-md border p-2 transition-colors",
                                                active
                                                    ? "border-primary bg-primary/5"
                                                    : "border-gray-200 bg-white hover:bg-gray-100",
                                            )}
                                        >
                                            <Avatar
                                                user={{
                                                    ...user,
                                                    avatar_style: "boring",
                                                    avatar_variant: v,
                                                    avatar_color: null,
                                                }}
                                                size="md"
                                            />
                                            <span className="text-[10px] text-gray-700">
                                                {boringVariantLabel[v]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {style === "hashvatar" && (
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">
                                    الوضع
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {hashvatarModes.map((m) => (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() =>
                                                onChange({
                                                    hashvatar_mode: m.value,
                                                })
                                            }
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                                                (hashvatarMode ?? "gradient") ===
                                                    m.value
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                                            )}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    <input
                                        type="checkbox"
                                        checked={hashvatarAnimated}
                                        onChange={(e) =>
                                            onChange({
                                                hashvatar_animated:
                                                    e.target.checked,
                                            })
                                        }
                                        className="rounded border-gray-300"
                                    />
                                    متحرّك
                                </label>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-900 mb-2">
                                    الألوان
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {hashvatarTonesList.map((t) => (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() =>
                                                onChange({
                                                    hashvatar_tones: t.value,
                                                })
                                            }
                                            className={cn(
                                                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                                                (hashvatarTones ?? "auto") ===
                                                    t.value
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100",
                                            )}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvatarPicker;
