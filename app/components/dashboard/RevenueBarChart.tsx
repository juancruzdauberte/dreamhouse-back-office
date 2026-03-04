"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RevenueByMonthDTO } from "../../lib/repository/booking/booking.dto";

interface RevenueBarChartProps {
  data: RevenueByMonthDTO[];
}

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: date.toLocaleDateString("es-AR", {
        month: "short",
        year: "numeric",
      }),
      revenue: Number(item.revenue),
    };
  });

  return (
    <Card className="col-span-1 gap-5 border-[oklch(0.9_0.01_80)]/90 bg-white/80 py-5 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.8)] lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-[oklch(0.3_0.02_250)]">Ingresos USD por Mes</CardTitle>
        <CardDescription className="text-[oklch(0.53_0.02_250)]">
          Monto total cotizado (sin calcular comisiones).
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{ top: 20, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString("es-AR")}`,
                  "Ingresos",
                ]}
                cursor={{ fill: "oklch(0.95 0.01 80 / 0.55)" }}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "10px",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Bar
                dataKey="revenue"
                fill="var(--color-chart-1)"
                radius={[8, 8, 2, 2]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
