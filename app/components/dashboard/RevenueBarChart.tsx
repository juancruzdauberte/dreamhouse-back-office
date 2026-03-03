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
  // Format the month to something more readable (YY-MM to Month Short Name)
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
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Ingresos USD por Mes</CardTitle>
        <CardDescription>
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
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3).toUpperCase()}
              />
              <Tooltip
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString("es-AR")}`,
                  "Ingresos",
                ]}
                labelStyle={{ color: "black" }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
