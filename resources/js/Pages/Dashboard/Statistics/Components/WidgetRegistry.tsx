import { DropdownMenuItem } from "@/Components/ui/dropdown-menu";
import { Statistics } from "@/types";
import { Download } from "lucide-react";
import { ReactNode } from "react";
import AttendanceChartWidget from "./widgets/AttendanceChartWidget";
import AttendanceRateWidget from "./widgets/AttendanceRateWidget";
import CategoryBreakdownWidget, {
    exportCategoryBreakdownToCSV,
} from "./widgets/CategoryBreakdownWidget";
import FinancialTotalWidget from "./widgets/FinancialTotalWidget";
import MostAbsentWidget from "./widgets/MostAbsentWidget";
import NegativeCreditWidget from "./widgets/NegativeCreditWidget";
import PersonnelWidget from "./widgets/PersonnelWidget";
import ProgressOverviewWidget from "./widgets/ProgressOverviewWidget";
import RevenueByClubWidget from "./widgets/RevenueByClubWidget";
import RevenueByTypeWidget from "./widgets/RevenueByTypeWidget";
import StudentCountWidget from "./widgets/StudentCountWidget";
import StudentsByCategoryWidget from "./widgets/StudentsByCategoryWidget";
import StudentsByClubCategoryWidget from "./widgets/StudentsByClubCategoryWidget";
import StudentsByClubWidget from "./widgets/StudentsByClubWidget";
import TopPerformersWidget from "./widgets/TopPerformersWidget";

export interface WidgetDefinition {
    type: string;
    title: string;
    icon?: ReactNode;
    component: React.FC<{ statistics: Statistics }>;
    getMenuItems?: (statistics: Statistics) => ReactNode;
}

export const widgetRegistry: Record<string, WidgetDefinition> = {
    financial_total: {
        type: "financial_total",
        title: "إجمالي الإيرادات",
        component: FinancialTotalWidget,
    },
    revenue_by_type: {
        type: "revenue_by_type",
        title: "الإيرادات حسب النوع",
        component: RevenueByTypeWidget,
    },
    revenue_by_club: {
        type: "revenue_by_club",
        title: "الإيرادات حسب النادي",
        component: RevenueByClubWidget,
    },
    attendance_rate: {
        type: "attendance_rate",
        title: "نسبة الحضور",
        component: AttendanceRateWidget,
    },
    attendance_chart: {
        type: "attendance_chart",
        title: "توزيع الحضور",
        component: AttendanceChartWidget,
    },
    student_count: {
        type: "student_count",
        title: "عدد الطلاب",
        component: StudentCountWidget,
    },
    students_by_club: {
        type: "students_by_club",
        title: "الطلاب حسب النادي",
        component: StudentsByClubWidget,
    },
    negative_credit: {
        type: "negative_credit",
        title: "رصيد سالب",
        component: NegativeCreditWidget,
    },
    personnel_by_role: {
        type: "personnel_by_role",
        title: "الموظفين",
        component: PersonnelWidget,
    },
    progress_overview: {
        type: "progress_overview",
        title: "نظرة على التقدم",
        component: ProgressOverviewWidget,
    },
    top_performers: {
        type: "top_performers",
        title: "أفضل المتفوقين",
        component: TopPerformersWidget,
    },
    most_absent: {
        type: "most_absent",
        title: "الأكثر غياباً",
        component: MostAbsentWidget,
    },
    students_by_category: {
        type: "students_by_category",
        title: "الطلاب حسب الفئة",
        component: StudentsByCategoryWidget,
    },
    students_by_club_category: {
        type: "students_by_club_category",
        title: "الطلاب حسب النادي والفئة",
        component: StudentsByClubCategoryWidget,
    },
    category_breakdown: {
        type: "category_breakdown",
        title: "تقرير الطلاب حسب الفئة",
        component: CategoryBreakdownWidget,
        getMenuItems: (statistics: Statistics) => (
            <DropdownMenuItem
                onClick={() =>
                    exportCategoryBreakdownToCSV(
                        statistics.students.category_breakdown
                    )
                }
            >
                <Download className="ml-2 h-4 w-4" />
                تصدير
            </DropdownMenuItem>
        ),
    },
};

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
    return widgetRegistry[type];
}
