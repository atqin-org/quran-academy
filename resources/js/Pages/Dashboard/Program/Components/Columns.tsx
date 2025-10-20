import { ColumnDef } from "@tanstack/react-table"

// نوع البيانات الخاصة بالبرنامج
export type Program = {
  id: number
  subject_name: string
  club_name: string
  category_name: string
  start_date: string
  end_date: string
  days_of_week: string[]
}

// تعريف الأعمدة لجدول البرامج
export const columns: ColumnDef<Program>[] = [
  {
    accessorKey: "subject_name",
    header: "المادة",
  },
  {
    accessorKey: "club_name",
    header: "النادي",
  },
  {
    accessorKey: "category_name",
    header: "الفئة",
  },
  {
    accessorKey: "start_date",
    header: "تاريخ البداية",
  },
  {
    accessorKey: "end_date",
    header: "تاريخ النهاية",
  },
  {
    accessorKey: "days_of_week",
    header: "أيام الأسبوع",
    cell: ({ getValue }) => (getValue() as string[]).join(", "),
  },
  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <a
          href={`/programs/${row.original.id}`}
          className="text-blue-600 hover:underline"
        >
          عرض
        </a>
        <a
          href={`/programs/${row.original.id}/edit`}
          className="text-green-600 hover:underline"
        >
          تعديل
        </a>
        <button
          className="text-red-600 hover:underline"
          onClick={() => {
            if (confirm("هل أنت متأكد من الحذف؟")) {
              // هنا يمكنك استدعاء Inertia.delete أو أي دالة حذف
            }
          }}
        >
          حذف
        </button>
      </div>
    ),
  },
]
