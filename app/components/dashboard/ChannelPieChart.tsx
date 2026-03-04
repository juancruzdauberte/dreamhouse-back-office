"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookingsByChannelDTO } from "../../lib/repository/booking/booking.dto";

interface ChannelPieChartProps {
  data: BookingsByChannelDTO[];
}

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-5)",
  "oklch(0.58 0.12 25)",
  "oklch(0.63 0.06 230)",
  "oklch(0.52 0.08 180)",
];

export function ChannelPieChart({ data }: ChannelPieChartProps) {
  return (
    <Card className="col-span-1 gap-5 border-[oklch(0.9_0.01_80)]/90 bg-white/80 py-5 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.8)] lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-[oklch(0.3_0.02_250)]">
          Distribucion por Canal
        </CardTitle>
        <CardDescription className="text-[oklch(0.53_0.02_250)]">
          Reservas divididas por plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                fill="#8884d8"
                paddingAngle={3}
                dataKey="bookings"
                nameKey="channel_name"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} reservas`, name]}
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  borderRadius: "10px",
                }}
                labelStyle={{ color: "var(--color-foreground)" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{
                  color: "var(--color-muted-foreground)",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
