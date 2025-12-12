import { Link } from "@inertiajs/react";
import { TUser } from "@/types";
import { profileMenuLinks } from "@/Data/Routes";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";

interface ProfileMenuProps {
    auth: TUser;
    isCollapsed: boolean;
    mobile?: boolean;
}

const translateRole = (role: string) => {
    switch (role) {
        case "admin":
            return "مشرف عام";
        case "moderator":
            return "مدير";
        case "staff":
            return "مشرف";
        case "teacher":
            return "معلم";
        default:
            return role;
    }
};

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
    // Generate a hash from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to pick a color
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
};

// Get initials from name with separator
const getInitials = (firstName: string, lastName: string): string => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return `${first}.${last}`;
};

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    auth,
    isCollapsed,
    mobile,
}) => {
    const filteredLinks = profileMenuLinks.filter(
        (link) => !link.visibleFor || link.visibleFor.includes(auth.role)
    );

    const initials = getInitials(auth.name, auth.last_name);
    const avatarColor = getAvatarColor(`${auth.name} ${auth.last_name}`);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "border-2 border-primary w-full px-2 py-2 text-center rounded-md flex gap-2 items-center text-nowrap",
                        "hover:bg-gray-50 transition-colors",
                        {
                            "justify-center": isCollapsed && !mobile,
                            "justify-start": !isCollapsed || mobile,
                        }
                    )}
                >
                    <div
                        className={cn(
                            "flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold shadow-sm",
                            avatarColor,
                            "w-9 h-9 text-xs"
                        )}
                    >
                        {initials}
                    </div>
                    {(!isCollapsed || mobile) && (
                        <div className="flex flex-col items-start text-sm flex-1 min-w-0">
                            <span className={`truncate font-semibold text-start ${mobile ? "" : "w-24"}`}>
                                {auth.name} {auth.last_name}
                            </span>
                            <span className="truncate text-xs text-gray-500">
                                {translateRole(auth.role)}
                            </span>
                        </div>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent
                dir="rtl"
                className="w-56 p-1"
                side={mobile ? "top" : "left"}
                align="end"
                sideOffset={8}
            >
                {/* User info header in popover */}
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="font-semibold text-sm text-gray-900">
                        {auth.name} {auth.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{auth.email}</p>
                </div>

                {/* Menu items */}
                <div className="flex flex-col">
                    {filteredLinks.map((link, index) => {
                        const isLogout = link.isLogout;
                        const isLast = index === filteredLinks.length - 1;

                        if (isLogout) {
                            return (
                                <div key={link.href}>
                                    {!isLast && <div className="border-t border-gray-100 my-1" />}
                                    <Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-red-600 hover:bg-red-50"
                                    >
                                        {link.icon}
                                        {link.label}
                                    </Link>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-gray-700 hover:bg-gray-100"
                            >
                                {link.icon}
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ProfileMenu;
