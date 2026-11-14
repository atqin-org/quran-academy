import { Link, usePage } from "@inertiajs/react";
import { PageProps, TUser } from "@/types";
import { profileMenuLinks } from "@/Data/Routes";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import Avatar from "@/Components/costume-cn/Avatar";

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

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    auth,
    isCollapsed,
    mobile,
}) => {
    const { version } = usePage<PageProps>().props;
    const filteredLinks = profileMenuLinks.filter(
        (link) => !link.visibleFor || link.visibleFor.includes(auth.role)
    );

    const dotClass =
        version?.is_latest === true
            ? "bg-emerald-500"
            : version?.is_latest === false
            ? "bg-amber-500"
            : "bg-gray-300";

    const versionTooltip =
        version?.is_latest === true
            ? "أحدث إصدار"
            : version?.is_latest === false && version.latest
            ? `إصدار جديد متوفر: v${version.latest}`
            : "تعذّر التحقق من الإصدار";

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "border-2 border-primary w-full px-2 py-2 text-center rounded-full flex gap-2 items-center text-nowrap",
                        "hover:bg-gray-50 transition-colors",
                        {
                            "justify-center": isCollapsed && !mobile,
                            "justify-start": !isCollapsed || mobile,
                        }
                    )}
                >
                    <Avatar user={auth} size="md" />
                    {(!isCollapsed || mobile) && (
                        <div className="flex flex-col items-start text-sm flex-1 min-w-0">
                            <span className={`truncate font-semibold text-start ${mobile ? "" : "w-[100px]"}`}>
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

                {version?.current && (
                    <div className="border-t border-gray-100 mt-1 pt-2">
                        <a
                            href={
                                version.is_latest === false && version.latest_url
                                    ? version.latest_url
                                    : version.releases_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            title={versionTooltip}
                            className="flex items-center justify-between px-3 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        dotClass
                                    )}
                                    aria-hidden
                                />
                                v{version.current}
                            </span>
                            {version.is_latest === false && version.latest && (
                                <span className="text-amber-600">
                                    تحديث متاح
                                </span>
                            )}
                        </a>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default ProfileMenu;
