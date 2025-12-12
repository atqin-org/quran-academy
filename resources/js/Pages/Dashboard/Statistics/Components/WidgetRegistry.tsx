import { Statistics } from "@/types";
import { ReactNode } from "react";
import FinancialTotalWidget from "./widgets/FinancialTotalWidget";
import RevenueByTypeWidget from "./widgets/RevenueByTypeWidget";
import RevenueByClubWidget from "./widgets/RevenueByClubWidget";
import AttendanceRateWidget from "./widgets/AttendanceRateWidget";
import AttendanceChartWidget from "./widgets/AttendanceChartWidget";
import StudentCountWidget from "./widgets/StudentCountWidget";
import StudentsByClubWidget from "./widgets/StudentsByClubWidget";
import NegativeCreditWidget from "./widgets/NegativeCreditWidget";
import PersonnelWidget from "./widgets/PersonnelWidget";
import ProgressOverviewWidget from "./widgets/ProgressOverviewWidget";
import TopPerformersWidget from "./widgets/TopPerformersWidget";
import MostAbsentWidget from "./widgets/MostAbsentWidget";
import StudentsByCategoryWidget from "./widgets/StudentsByCategoryWidget";
import StudentsByClubCategoryWidget from "./widgets/StudentsByClubCategoryWidget";

export interface WidgetDefinition {
    type: string;
    title: string;
    icon?: ReactNode;
    component: React.FC<{ statistics: Statistics }>;
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
};

export function getWidgetDefinition(type: string): WidgetDefinition | undefined {
    return widgetRegistry[type];
}
