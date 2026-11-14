import BoringAvatar from "boring-avatars";
import { Hashvatar } from "hashvatar/react";
import { cn } from "@/lib/utils";
import {
    AvatarStyle,
    BoringVariant,
    HashvatarMode,
    HashvatarTones,
    TUser,
} from "@/types";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarUser {
    name: string;
    last_name?: string | null;
    avatar_style?: TUser["avatar_style"];
    avatar_color?: TUser["avatar_color"];
    avatar_variant?: TUser["avatar_variant"];
    hashvatar_mode?: TUser["hashvatar_mode"];
    hashvatar_animated?: TUser["hashvatar_animated"];
    hashvatar_tones?: TUser["hashvatar_tones"];
}

interface AvatarProps {
    user: AvatarUser;
    size?: AvatarSize;
    className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-20 h-20 text-base",
};

const sizePixels: Record<AvatarSize, number> = {
    xs: 24,
    sm: 32,
    md: 36,
    lg: 48,
    xl: 80,
};

const hashColors = [
    "bg-red-600",
    "bg-orange-600",
    "bg-amber-600",
    "bg-green-600",
    "bg-emerald-600",
    "bg-teal-600",
    "bg-cyan-700",
    "bg-sky-600",
    "bg-blue-600",
    "bg-indigo-600",
    "bg-violet-600",
    "bg-purple-600",
    "bg-fuchsia-600",
    "bg-pink-600",
    "bg-rose-600",
];

export const hashvatarTonePresets: Record<HashvatarTones, string[] | undefined> = {
    auto: undefined,
    ocean: ["#0ea5e9", "#06b6d4", "#3b82f6"],
    sunset: ["#f97316", "#ec4899", "#f59e0b"],
    forest: ["#22c55e", "#10b981", "#84cc16"],
    candy: ["#ec4899", "#f472b6", "#a855f7"],
    warm: ["#ef4444", "#f97316", "#eab308"],
    mono: ["#1f2937", "#6b7280"],
};

const hashString = (input: string): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const initialsOf = (firstName: string, lastName?: string | null): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first && last ? `${first}.${last}` : first || last || "?";
};

const textColorForBg = (hex: string): string => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? "#000000" : "#ffffff";
};

const boringPalette = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"];

const Avatar: React.FC<AvatarProps> = ({ user, size = "sm", className }) => {
    const style: AvatarStyle = (user.avatar_style as AvatarStyle) || "initials";
    const fullName = `${user.name ?? ""} ${user.last_name ?? ""}`.trim();

    if (style === "boring") {
        const variant: BoringVariant =
            (user.avatar_variant as BoringVariant) || "beam";
        return (
            <div
                className={cn(
                    "flex-shrink-0 overflow-hidden rounded-full shadow-sm",
                    sizeClasses[size],
                    className,
                )}
            >
                <BoringAvatar
                    size={sizePixels[size]}
                    name={fullName || "anonymous"}
                    variant={variant}
                    colors={boringPalette}
                />
            </div>
        );
    }

    if (style === "hashvatar") {
        const mode: HashvatarMode = user.hashvatar_mode || "gradient";
        const animated = !!user.hashvatar_animated;
        const tonesKey: HashvatarTones = user.hashvatar_tones || "auto";
        const tones = hashvatarTonePresets[tonesKey];

        return (
            <div
                className={cn(
                    "flex-shrink-0 overflow-hidden shadow-sm rounded-full ",
                    sizeClasses[size],
                    className,
                )}
            >
                <Hashvatar
                    hash={fullName || "anonymous"}
                    size={sizePixels[size]}
                    mode={mode}
                    animated={animated}
                    tones={tones}
                />
            </div>
        );
    }

    // initials (default)
    const initials = initialsOf(user.name, user.last_name);
    const customBg = user.avatar_color;

    if (customBg) {
        return (
            <div
                style={{
                    backgroundColor: customBg,
                    color: textColorForBg(customBg),
                }}
                className={cn(
                    "flex-shrink-0 flex items-center justify-center rounded-full font-bold shadow-sm",
                    sizeClasses[size],
                    className,
                )}
            >
                {initials}
            </div>
        );
    }

    const hashedColor = hashColors[hashString(fullName) % hashColors.length];
    return (
        <div
            className={cn(
                "flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold shadow-sm",
                hashedColor,
                sizeClasses[size],
                className,
            )}
        >
            {initials}
        </div>
    );
};

export default Avatar;
