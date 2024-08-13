import React from 'react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@radix-ui/react-tooltip';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';


interface SidebarLinkProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isCollapsed: boolean;
    isSelected: boolean;
    className?: string;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, icon, label, isCollapsed, isSelected ,className}) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    href={href}
                    className={cn(`flex gap-2 ${
                        isCollapsed ? 'justify-center' : 'justify-start'
                    } ${
                        isSelected
                            ? 'text-white bg-primary ring-2 hover:bg-primary/90'
                            : 'hover:bg-zinc-100 hover:ring-2 ring-primary'
                    } hover:ring-2 ring-primary rounded-md w-full px-2 py-1 `, className)}
                >
                    {icon}
                    {!isCollapsed && label}
                </Link>
            </TooltipTrigger>
            {isCollapsed && (
                <TooltipContent side="left"
                className='bg-primary-foreground text-primary ring-1 ring-primary p-2 rounded-md mx-8'
                >
                    <p>{label}</p>
                </TooltipContent>
            )}
        </Tooltip>
    );
};

export default SidebarLink;
