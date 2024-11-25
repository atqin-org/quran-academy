import { Head } from "@inertiajs/react";
import { DatabaseBackup, PageProps } from "@/types";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import { CloudDownload, Database, FileJson2, Save, Trash2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/Components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ar } from 'date-fns/locale';
const backupsData: DatabaseBackup[] = [
    {
        id: 1,
        user_id: 1,
        path: "backup-2021-09-01.sql",
        created_at: "2021-09-01 12:00:00",
        updated_at: "2021-09-01 12:00:00",
    },
    {
        id: 2,
        user_id: 1,
        path: "backup-2021-09-02.sql",
        created_at: "2021-09-02 12:00:00",
        updated_at: "2021-09-02 12:00:00",
    },
];

export default function BackupDatabase({ auth }: PageProps) {
    const [backups, setBackups] = useState<DatabaseBackup[]>([]);

    // Load all generated backups.

    useEffect(() => {
        axios.get("/get-backups").then((response) => {
            setBackups(response.data);
        });
    }, []);

    // Perform the backup process.
    const [isBackingUp, setIsBackingUp] = useState(false);
    const backup = () => {
        setIsBackingUp(true);
        axios
            .post("/backup")
            .then((response) => {
                setIsBackingUp(false);
            })
            .catch((error) => {});
    };

    const download = (path: string) => {
        window.location.href = `/backup/${path}`;
    };

    const deleteBackup = (path: string, id: number) => {
        axios
            .post("/delete-backup", {
                id: id,
                backup_file: path,
            })
            .then((response) => {
                setBackups((prevBackups) => {
                    return prevBackups.filter((backup) => backup.path !== path);
                });
            });
    };

    return (
        <DashboardLayout
            user={auth.user}
            //header={<h2 className="text-2xl font-black">System Maintenance</h2>}
        >
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 w-full overflow-y-scroll scroll-smooth py-4">
                <div className="">
                    <Card className="relative h-fit w-full overflow-hidden xl:col-span-5">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-2xl font-bold">
                                <span>النسخ الاحتياطية لقاعدة البيانات</span>
                                <span>
                                    <Database className="size-7" />
                                </span>
                            </CardTitle>
                            <CardDescription>
                                يمكنك هنا إنشاء نسخ احتياطية لقاعدة البيانات
                                الخاصة بالنظام وتحميلها وحذفها.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative flex flex-col gap-2">
                            <Button
                                className="flex items-center gap-2 self-start hover:bg-gray-600 active:bg-black dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white"
                                onClick={backup}
                                disabled={isBackingUp}
                            >
                                <Save className="size-5" />
                                <span>
                                    {isBackingUp
                                        ? "جاري النسخ الاحتياطي..."
                                        : "إنشاء نسخة احتياطية"}
                                </span>
                            </Button>
                            {backups.length > 0 ? (
                                <Table className="mb-4 h-full">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-center">
                                                الملف
                                            </TableHead>
                                            <TableHead className="hidden sm:table-cell text-center">
                                                تاريخ الإنشاء
                                            </TableHead>
                                            <TableHead className="text-center">
                                                الإجراءات
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {backups?.map((backup, index) => (
                                            <TableRow key={backup.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 font-mono font-medium">
                                                        <FileJson2 className="size-5" />
                                                        <span>
                                                            {backup.path}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center sm:table-cell">
                                                                                                        <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <p>{formatDistanceToNow(new Date(backup.created_at), { locale: ar})}</p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {backup.created_at}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className=" sm:table-cell">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            className="flex items-center gap-1 hover:ring ring-primary"
                                                            variant="secondary"
                                                            onClick={() =>
                                                                download(
                                                                    backup.path
                                                                )
                                                            }
                                                        >
                                                            <span className="hidden sm:flex">
                                                                تحميل
                                                            </span>
                                                            <CloudDownload className="size-5" />
                                                        </Button>
                                                        <Button
                                                            className="flex items-center gap-1 hover:ring ring-destructive"
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                deleteBackup(
                                                                    backup.path,
                                                                    backup.id
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="mt-2 rounded-lg bg-gray-100 py-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-white">
                                    لم يتم إنشاء أي نسخ احتياطية حتى الآن.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
