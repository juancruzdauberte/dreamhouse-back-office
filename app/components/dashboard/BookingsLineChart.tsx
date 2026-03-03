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
  // Format the month
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
    <Card className="col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Tendencia de Reservas</CardTitle>
        <CardDescription>Cantidad de reservas por mes</CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
                formatter={(value, name) => [`${value}`, "Reservas"]}
                labelStyle={{ color: "black" }}
              />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
