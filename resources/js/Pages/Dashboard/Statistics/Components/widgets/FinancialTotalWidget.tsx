import { Statistics } from "@/types";
import { Banknote, TrendingUp } from "lucide-react";

interface Props {
    statistics: Statistics;
}

export default function FinancialTotalWidget({ statistics }: Props) {
    const { financial } = statistics;

    return (
        <div className="flex flex-col justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Banknote className="h-5 w-5" />
                <span className="text-sm">إجمالي الإيرادات</span>
            </div>
            <div className="text-3xl font-bold text-primary">
                {financial.total_revenue.toLocaleString("ar-DZ")} د.ج
            </div>
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                    <span>الخصومات:</span>
                    <span className="text-red-500">
                        -{financial.total_discount.toLocaleString("ar-DZ")} د.ج
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>الصافي: </span>
                <span className="font-semibold text-green-600">
                    {financial.net_revenue.toLocaleString("ar-DZ")} د.ج
                </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
                عدد المدفوعات: {financial.payment_count}
            </div>
        </div>
    );
}
