"use client";

import {
  Line,
  LineChart,
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
import { BookingsByMonthDTO } from "../../lib/repository/booking/booking.dto";

interface BookingsLineChartProps {
  data: BookingsByMonthDTO[];
}

export function BookingsLineChart({ data }: BookingsLineChartProps) {
  const formattedData = data.map((item) => {
    const [year, month] = item.month.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return {
      month: date.toLocaleDateString("es-AR", {
        month: "short",
        year: "numeric",
      }),
      bookings: Number(item.bookings),
    };
  });

  return (
    <Card className="col-span-1 gap-5 border-[oklch(0.9_0.01_80)]/90 bg-white/80 py-5 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.8)] lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-[oklch(0.3_0.02_250)]">
          Tendencia de Reservas
        </CardTitle>
        <CardDescription className="text-[oklch(0.53_0.02_250)]">
          Cantidad de reservas por mes
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
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
              <Tooltip
                formatter={(value) => [`${value}`, "Reservas"]}
                cursor={{ stroke: "var(--color-chart-2)", strokeWidth: 1.4 }}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "10px",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="var(--color-chart-2)"
                strokeWidth={3}
                dot={{ r: 3, fill: "var(--color-chart-2)", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "var(--color-chart-2)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
