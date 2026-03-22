import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    getSortedRowModel,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
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
import { router } from "@inertiajs/react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Separator } from "@/Components/ui/separator";
import { Badge } from "@/Components/ui/badge";
import { Skeleton } from "@/Components/ui/skeleton";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchParams: {
        categories: string[] | null;
        clubs: string[] | null;
        gender: string[] | null;
        search: string | null;
        sortBy: string | null;
        sortType: string | null;
        per_page: string | null;
    };
    dataDependencies: {
        categories: {
            id: number;
            name: string;
            students_count: number;
            gender: string | null;
        }[];
        clubs: { id: number; name: string; students_count: number }[];
        genders: { gender: string; total: number }[];
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

const perPageOptions = [10, 25, 50, 100];

export function DataTable<TData, TValue>({
    columns,
    data,
    searchParams,
    dataDependencies,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [searchTerm, setSearchTerm] = React.useState(
        searchParams.search ?? ""
    );
    const [selectedSortBy, setSelectedSortBy] = React.useState(
        searchParams.sortBy ?? sortedBy[0].value
    );
    const [sortTypeIsAsc, setSortTypeIsAsc] = React.useState(
        searchParams.sortType === "asc"
    );
    const [selectedGender, setSelectedGender] = React.useState<string[]>(
        searchParams.gender ?? []
    );
    const [selectedClub, setSelectedClub] = React.useState<string[]>(
        searchParams.clubs ?? []
    );
    const [selectedCategory, setSelectedCategory] = React.useState<string[]>(
        searchParams.categories ?? []
    );
    const [selectedPerPage, setSelectedPerPage] = React.useState(
        searchParams.per_page ? parseInt(searchParams.per_page) : 10
    );
    const [isLoading, setIsLoading] = React.useState(false);

    const isInitialMount = React.useRef(true);
    const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const buildRequestData = React.useCallback(() => ({
        search: searchTerm || undefined,
        sortBy: selectedSortBy,
        sortType: sortTypeIsAsc ? "asc" : "desc",
        gender: selectedGender.length > 0 ? selectedGender : undefined,
        clubs: selectedClub.length > 0 ? selectedClub : undefined,
        categories: selectedCategory.length > 0 ? selectedCategory : undefined,
        per_page: selectedPerPage !== 10 ? selectedPerPage : undefined,
    }), [searchTerm, selectedSortBy, sortTypeIsAsc, selectedGender, selectedClub, selectedCategory, selectedPerPage]);

    const fireRequest = React.useCallback(() => {
        setIsLoading(true);
        router.get(route("students.index"), buildRequestData(), {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    }, [buildRequestData]);

    // Auto-apply filters (sort, gender, category, club, per_page) with debounce
    React.useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            fireRequest();
        }, 300);
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [selectedSortBy, sortTypeIsAsc, selectedGender, selectedClub, selectedCategory, selectedPerPage]);

    const handleSearchTermChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(event.target.value);
    };
    const handleSearchRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        fireRequest();
    };
    const handleSortByChange = (value: string) => {
        setSelectedSortBy(value);
    };
    const handleSortTypeChange = (value: boolean) => {
        setSortTypeIsAsc(value);
    };
    const handleGenderChange = (gender: string) => {
        setSelectedGender((prev) =>
            prev.includes(gender)
                ? prev.filter((item) => item !== gender)
                : [...prev, gender]
        );
    };
    const genderTotals: { [key: string]: number } =
        dataDependencies.genders.reduce(
            (acc: { [key: string]: number }, gender) => {
                acc[gender.gender] = gender.total;
                return acc;
            },
            {}
        );
    const handleCategoryChange = (categoryId: string) => {
        setSelectedCategory((prev) =>
            prev.includes(categoryId)
                ? prev.filter((item) => item !== categoryId)
                : [...prev, categoryId]
        );
    };
    const handleClubChange = (clubId: string) => {
        setSelectedClub((prev) =>
            prev.includes(clubId)
                ? prev.filter((item) => item !== clubId)
                : [...prev, clubId]
        );
    };
    const handlePerPageChange = (value: string) => {
        setSelectedPerPage(parseInt(value));
    };
    const handleExport = () => {
        window.open(
            route("students.export", {
                search: searchTerm || undefined,
                sortBy: selectedSortBy,
                sortType: sortTypeIsAsc ? "asc" : "desc",
                categories: selectedCategory.length > 0 ? selectedCategory : undefined,
                clubs: selectedClub.length > 0 ? selectedClub : undefined,
                gender: selectedGender.length > 0 ? selectedGender : undefined,
            }),
            "_new"
        );
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
                        value={searchTerm}
                        onChange={handleSearchTermChange}
                        className=""
                    />
                    <Button type="submit">
                        <Search />
                    </Button>
                </form>
                <div className="hidden xl:flex items-center w-fit gap-2">
                    <Separator
                        orientation="vertical"
                        className="h-8 w-0.5 bg-neutral-300 rounded-3xl"
                    />
                    <div className=" flex items-center gap-2 ps-2 w-fit rounded-md">
                        <span className="text-nowrap">رتب :</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    {
                                        sortedBy.find(
                                            (sort) =>
                                                sort.value === selectedSortBy
                                        )?.label
                                    }
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuRadioGroup
                                    dir="rtl"
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
                            {sortTypeIsAsc
                                ? "تصاعديا"
                                : "تنازليا"}
                        </Button>
                    </div>
                    <Separator
                        orientation="vertical"
                        className="h-8 w-0.5 bg-neutral-300 rounded-3xl"
                    />
                    <div className="flex items-center gap-2 ring-2ring-primary w-fit rounded-md">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex gap-1"
                                >
                                    <span>الجنس</span>
                                    <Badge className="px-1.5">
                                        {selectedGender.length}
                                    </Badge>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuCheckboxItem
                                    dir="rtl"
                                    className="capitalize"
                                    checked={selectedGender.includes("male")}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleGenderChange("male");
                                    }}
                                >
                                    الذكور ({genderTotals.male || 0})
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    dir="rtl"
                                    className="capitalize"
                                    checked={selectedGender.includes("female")}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleGenderChange("female");
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
                                    className="flex gap-1"
                                >
                                    <span>الفئة</span>
                                    <Badge className="px-1.5">
                                        {selectedCategory.length}
                                    </Badge>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {dataDependencies.categories.map((category) => (
                                    <DropdownMenuCheckboxItem
                                        dir="rtl"
                                        key={category.id}
                                        className="capitalize"
                                        checked={selectedCategory.includes(
                                            category.id.toString()
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleCategoryChange(
                                                category.id.toString()
                                            );
                                        }}
                                    >
                                        <div className="flex gap-2 justify-between w-full">
                                            <span
                                                className={`
                                            ${
                                                category.gender === "male"
                                                    ? "text-blue-500"
                                                    : category.gender ===
                                                      "female"
                                                    ? "text-pink-500"
                                                    : ""
                                            }
                                            `}
                                            >
                                                {category.name}
                                            </span>
                                            <span className="m-0">
                                                ({category.students_count})
                                            </span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex gap-1"
                                >
                                    <span>النادي</span>
                                    <Badge className="px-1.5">
                                        {selectedClub.length}
                                    </Badge>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {dataDependencies.clubs.map((club) => (
                                    <DropdownMenuCheckboxItem
                                        dir="rtl"
                                        key={club.id}
                                        className="capitalize"
                                        checked={selectedClub.includes(
                                            club.id.toString()
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleClubChange(
                                                club.id.toString()
                                            );
                                        }}
                                    >
                                        <div className="flex gap-2 justify-between w-full">
                                            <span>{club.name}</span>
                                            <span className="m-0">
                                                ({club.students_count})
                                            </span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Separator
                            orientation="vertical"
                            className="h-8 w-0.5 bg-neutral-300 rounded-3xl"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="flex gap-1"
                            onClick={handleExport}
                        >
                            <span>تصدير</span>
                            <FileSpreadsheet />
                        </Button>
                    </div>
                </div>
                <Separator
                    orientation="vertical"
                    className="h-8 w-0.5 bg-neutral-300 rounded-3xl"
                />
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
            <div className="flex lg:flex-row flex-col justify-between items-start lg:items-center gap-2 xl:hidden my-3">
                <div className="flex justify-start  items-center gap-2 ps-2 w-fit rounded-md">
                    <span className="text-nowrap">رتب :</span>
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
                                dir="rtl"
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
                <Separator
                    orientation="vertical"
                    className="h-8 w-0.5 bg-neutral-300 rounded-3xl lg:inline-block hidden"
                />
                <div className="flex items-center gap-2 ring-2ring-primary w-fit rounded-md">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex gap-1">
                                <span>الجنس</span>
                                <Badge className="px-1.5">
                                    {selectedGender.length}
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuCheckboxItem
                                dir="rtl"
                                className="capitalize"
                                checked={selectedGender.includes("male")}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleGenderChange("male");
                                }}
                            >
                                الذكور ({genderTotals.male || 0})
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                dir="rtl"
                                className="capitalize"
                                checked={selectedGender.includes("female")}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleGenderChange("female");
                                }}
                            >
                                الاناث ({genderTotals.female || 0})
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex gap-1">
                                <span>الفئة</span>
                                <Badge className="px-1.5">
                                    {selectedCategory.length}
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {dataDependencies.categories.map((category) => (
                                <DropdownMenuCheckboxItem
                                    dir="rtl"
                                    key={category.id}
                                    className="capitalize"
                                    checked={selectedCategory.includes(
                                        category.id.toString()
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCategoryChange(
                                            category.id.toString()
                                        );
                                    }}
                                >
                                    <div className="flex gap-2 justify-between w-full">
                                        <span
                                            className={`
                                            ${
                                                category.gender === "male"
                                                    ? "text-blue-500"
                                                    : category.gender ===
                                                      "female"
                                                    ? "text-pink-500"
                                                    : ""
                                            }
                                            `}
                                        >
                                            {category.name}
                                        </span>
                                        <span className="m-0">
                                            ({category.students_count})
                                        </span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex gap-1">
                                <span>النادي</span>
                                <Badge className="px-1.5">
                                    {selectedClub.length}
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {dataDependencies.clubs.map((club) => (
                                <DropdownMenuCheckboxItem
                                    dir="rtl"
                                    key={club.id}
                                    className="capitalize"
                                    checked={selectedClub.includes(
                                        club.id.toString()
                                    )}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleClubChange(club.id.toString());
                                    }}
                                >
                                    <div className="flex gap-2 justify-between w-full">
                                        <span>{club.name}</span>
                                        <span className="m-0">
                                            ({club.students_count})
                                        </span>
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <Separator
                    orientation="vertical"
                    className="h-8 w-0.5 bg-neutral-300 rounded-3xl lg:inline-block hidden"
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="flex gap-1" onClick={handleExport}>
                        <span>تصدير</span>
                        <FileSpreadsheet />
                    </Button>
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
                        {isLoading ? (
                            Array.from({ length: selectedPerPage > 10 ? 10 : selectedPerPage }).map((_, i) => (
                                <TableRow key={`skeleton-${i}`}>
                                    {columns.map((_, colIdx) => (
                                        <TableCell key={colIdx} className="p-3">
                                            <Skeleton className="h-5 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
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

export { perPageOptions };
