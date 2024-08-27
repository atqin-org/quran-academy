import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    getSortedRowModel,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/Components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { useForm } from "@inertiajs/react";
import { Search } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { gender } from "./data";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchParams: {
        search: string | null;
        sortBy: string | null;
        sortType: string | null;
    };
}

const sortedBy = [
    {
        label: "تاريخ الاضافة",
        value: "created_at",
        type: {
            ascLabel: "الاحدث اولا",
            descLabel: "الاقدم اولا",
        },
    },
    {
        label: "الاسم",
        value: "name",
        type: {
            ascLabel: "أ-ي",
            descLabel: "ي-أ",
        },
    },
    {
        label: "العمر",
        value: "birthdate",
        type: {
            ascLabel: "الاصغر اولا",
            descLabel: "الاكبر اولا",
        },
    },
    {
        label: "الاحزاب",
        value: "ahzab",
        type: {
            ascLabel: "الاقل",
            descLabel: "الاكثر",
        },
    },
];

export function DataTable<TData, TValue>({
    columns,
    data,
    searchParams,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [selectedSortBy, setSelectedSortBy] = React.useState(
        sortedBy[0].value
    );
    const [sortTypeIsAsc, setSortTypeIsAsc] = React.useState(false);
    const [rowSelection, setRowSelection] = React.useState({});
    const {
        setData,
        get,
        data: formData,
    } = useForm({
        search: searchParams.search,
        sortBy: searchParams.sortBy ?? sortedBy[0].value,
        sortType: searchParams.sortType ?? (sortTypeIsAsc ? "asc" : "desc"),
    });
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,

        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });
    const handleSearchTermChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const searchValue = event.target.value;
        setData("search", searchValue);
    };
    function handleSearchRequest(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        get(route("students.index"), {
            preserveState: true,
        });
    }

    const handleSortByChange = (value: string) => {
        setSelectedSortBy(value);
        //save in setData
        setData("sortBy", value);
        handleSearchRequest
    };
    const handleSortTypeChange = (value: boolean) => {
        setSortTypeIsAsc(value);
        //save in setData
        setData("sortType", value ? "asc" : "desc");
        handleSearchRequest;
    };
    return (
        <div className="w-full">
            <div className="flex items-center py-4 gap-2 w-full">
                <form
                    className="flex items-center gap-2 w-full "
                    onSubmit={handleSearchRequest}
                >
                    <Input
                        placeholder="ابحث عن طالب.."
                        value={formData.search || ""}
                        onChange={handleSearchTermChange}
                        className="max-w-sm"
                    />
                    <Button>
                        <Search />
                    </Button>
                </form>
                <div className="flex justify-between items-center gap-2 w-full">
                    <div className="flex-1">{/* filters */}</div>
                    {/*
                    <Button>
                        <Cross2Icon />
                        اعادة تعيين
                    </Button>
                    */}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            اخفاء
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        dir="rtl"
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 mb-4 ps-2 ring-2 ring-primary w-fit rounded-md">
                    <span>رتب</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {
                                    sortedBy.find(
                                        (sort) => sort.value === selectedSortBy
                                    )?.label
                                }
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup
                                value={selectedSortBy}
                                onValueChange={handleSortByChange}
                            >
                                {sortedBy.map((sort) => (
                                    <DropdownMenuRadioItem
                                        key={sort.value}
                                        value={sort.value}
                                        className="capitalize"
                                    >
                                        {sort.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                        variant="outline"
                        onClick={() => handleSortTypeChange(!sortTypeIsAsc)}
                    >
                        {sortTypeIsAsc ? "تصاعديا" : "تنازليا"}
                    </Button>
                </div>
                <div className="flex items-center gap-2 mb-4 ps-2 ring-2ring-primary w-fit rounded-md">
                    {/* filters placeholder */}
                </div>
            </div>

            <div className="rounded-md border">
                <Table className="mx-2">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className="p-3"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
