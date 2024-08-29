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
import { Separator } from "@/Components/ui/separator";

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

export function DataTable<TData, TValue>({
    columns,
    data,
    searchParams,
    dataDependencies,
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
    const [selectedGender, setSelectedGender] = React.useState<string[]>([]);
    const [selectedClub, setSelectedClub] = React.useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = React.useState<string[]>(
        []
    );
    const {
        setData,
        get,
        data: formData,
        processing,
    } = useForm({
        search: searchParams.search,
        sortBy: searchParams.sortBy ?? selectedSortBy,
        sortType: searchParams.sortType ?? (sortTypeIsAsc ? "asc" : "desc"),
        gender: searchParams.gender ?? selectedGender,
        clubs: searchParams.clubs ?? selectedClub,
        categories: searchParams.categories ?? selectedCategory,
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
    const handleSearchRequest = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        get(route("students.index"), {
            preserveState: true,
            preserveScroll: true,
        });
    };
    const handleSortByChange = (value: string) => {
        setSelectedSortBy(value);
        setData("sortBy", value);
        //handleSearchRequest((new Event('submit') as unknown) as React.FormEvent<HTMLFormElement>);
    };
    const handleSortTypeChange = (value: boolean) => {
        setSortTypeIsAsc(value);
        setData("sortType", value ? "asc" : "desc");
        //handleSearchRequest(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
    };
    const handleGenderChange = (gender: string) => {
        const updatedSelectedGender = (prevSelected: string[]) =>
            prevSelected.includes(gender)
                ? prevSelected.filter((item) => item !== gender)
                : [...prevSelected, gender];

        setSelectedGender((prevSelected) => {
            const newSelectedGender = updatedSelectedGender(prevSelected);
            setData("gender", newSelectedGender);
            return newSelectedGender;
        });
        //handleSearchRequest((new Event('submit') as unknown) as React.FormEvent<HTMLFormElement>);
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
        const updatedSelectedCategory = (prevSelected: string[]) =>
            prevSelected.includes(categoryId)
                ? prevSelected.filter((item) => item !== categoryId)
                : [...prevSelected, categoryId];

        setSelectedCategory((prevSelected) => {
            const newSelectedCategory = updatedSelectedCategory(prevSelected);
            setData("categories", newSelectedCategory);
            return newSelectedCategory;
        });
        //handleSearchRequest((new Event('submit') as unknown) as React.FormEvent<HTMLFormElement>);
    };
    const handleClubChange = (clubId: string) => {
        const updatedSelectedClub = (prevSelected: string[]) =>
            prevSelected.includes(clubId)
                ? prevSelected.filter((item) => item !== clubId)
                : [...prevSelected, clubId];

        setSelectedClub((prevSelected) => {
            const newSelectedClub = updatedSelectedClub(prevSelected);
            setData("clubs", newSelectedClub);
            return newSelectedClub;
        });
        //handleSearchRequest((new Event('submit') as unknown) as React.FormEvent<HTMLFormElement>);
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
                    <Button disabled={processing} type="submit">
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
            <div className="flex items-center gap-3 h-fit mb-2">
                <div className="flex items-center gap-2 ps-2 w-fit rounded-md">
                    <span>رتب :</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                {
                                    sortedBy.find(
                                        (sort) => sort.value === formData.sortBy
                                    )?.label
                                }
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup
                                dir="rtl"
                                value={formData.sortBy}
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
                        {formData.sortType === "asc" ? "تصاعديا" : "تنازليا"}
                    </Button>
                </div>
                <Separator
                    orientation="vertical"
                    className="h-8 w-0.5 bg-neutral-300 rounded-3xl"
                />
                <div className="flex items-center gap-2 ring-2ring-primary w-fit rounded-md">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">الجنس</Button>
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
                            <Button variant="outline">الفئة</Button>
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
                            <Button variant="outline">النادي</Button>
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
