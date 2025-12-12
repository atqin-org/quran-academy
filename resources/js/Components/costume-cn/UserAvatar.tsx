import { cn } from "@/lib/utils";

interface UserAvatarProps {
    firstName: string;
    lastName: string;
    size?: "xs" | "sm" | "md" | "lg";
    className?: string;
}

// Colors with good contrast for white text
const avatarColors = [
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

// Generate a consistent color based on name
const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
};

// Get initials from name with separator
const getInitials = (firstName: string, lastName: string): string => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first && last ? `${first}.${last}` : first || last || "?";
};

const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-xs",
    lg: "w-12 h-12 text-sm",
};

const UserAvatar: React.FC<UserAvatarProps> = ({
    firstName,
    lastName,
    size = "sm",
    className,
}) => {
    const initials = getInitials(firstName, lastName);
    const avatarColor = getAvatarColor(`${firstName} ${lastName}`);

    return (
        <div
            className={cn(
                "flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold shadow-sm",
                avatarColor,
                sizeClasses[size],
                className
            )}
        >
            {initials}
        </div>
    );
};

export default UserAvatar;
