import { cn } from "@/lib/utils";
import truncate from "truncate";

export interface FileUploadedProps {
    file: File;
    setData: (key: string, value: any) => void;
    name: string;
    className?: string;
}

const PDF = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide lucide-file-text", className)}
    >
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="M10 9H8" />
        <path d="M16 13H8" />
        <path d="M16 17H8" />
    </svg>
);

const Image = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide lucide-image", className)}
    >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
);

const Trash = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide lucide-trash", className)}
    >
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

const FileUploaded = ({
    file,
    setData,
    name,
    className,
}: FileUploadedProps) => {

    return (
        <div className={cn("flex justify-between items-center flex-row w-full h-16 mt-2 px-4 border-solid border-2 border-gray-200 rounded-lg shadow-sm", className)}>
            <div className="flex items-center flex-row gap-4 h-full">
                {file.type === "application/pdf" ? (
                    <PDF className="text-rose-700 w-6 h-6" />
                ) : (
                    <Image className="text-rose-700 w-6 h-6" />
                )}
                <div className="flex flex-col gap-0">
                    <div className="text-[0.85rem] font-medium leading-snug truncate">
                        {truncate(
                            file.name.split(".").slice(0, -1).join("."),
                            30
                        )}
                    </div>
                    <div className="text-[0.7rem] text-gray-500 leading-tight">
                        .{file.name.split(".").pop()} •{" "}
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                </div>
            </div>
            <div
                className="p-2 rounded-full border-solid border-2 border-gray-100 shadow-sm hover:bg-accent transition-all select-none cursor-pointer"
                onClick={() => setData(name, undefined)}
            >
                <Trash className="w-4 h-4" />
            </div>
        </div>
    );
};

export default FileUploaded;
