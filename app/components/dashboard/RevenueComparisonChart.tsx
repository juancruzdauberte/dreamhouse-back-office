"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface RevenueComparisonData {
  month: string;
  revenue_usd: number;
  converted_ars_to_usd: number;
}

interface RevenueComparisonChartProps {
  data: RevenueComparisonData[];
}

export function RevenueComparisonChart({ data }: RevenueComparisonChartProps) {
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: date.toLocaleDateString("es-AR", {
        month: "short",
        year: "numeric",
      }),
      "Ingresos USD": Number(item.revenue_usd),
      "ARS Convertido a USD": Number(item.converted_ars_to_usd),
    };
  });

  return (
    <Card className="col-span-1 gap-5 border-[oklch(0.9_0.01_80)]/90 bg-white/80 py-5 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.8)] lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-[oklch(0.3_0.02_250)]">
          Ingresos: USD vs ARS Convertido
        </CardTitle>
        <CardDescription className="text-[oklch(0.53_0.02_250)]">
          Comparación de ingresos usando tipos de cambio reales de cada reserva.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="h-[250px] w-full">
          <div className="w-full overflow-x-hidden min-w-0">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
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
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `$${Number(value).toLocaleString("es-AR")}`,
                  ]}
                  cursor={{ fill: "oklch(0.95 0.01 80 / 0.55)" }}
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "10px",
                  }}
                  labelStyle={{ color: "var(--color-foreground)" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Ingresos USD"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ARS Convertido a USD"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
