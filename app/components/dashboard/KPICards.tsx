import { DollarSign, Banknote, CheckCircle, BedDouble } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KPICardsProps {
  stats: {
    totalRevenueArs: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalNights: number;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  const cards = [
    {
      title: "Ingresos Totales (USD)",
      value: `$${stats.totalRevenue?.toLocaleString("es-AR")}`,
      note: "Suma total cotizada en USD",
      icon: DollarSign,
      iconColor: "text-[oklch(0.45_0.12_55)]",
      iconBg: "bg-[oklch(0.95_0.03_80)]",
    },
    {
      title: "Ingresos Totales (ARS)",
      value: `$${stats.totalRevenueArs?.toLocaleString("es-AR")}`,
      note: "Suma total cotizada en ARS",
      icon: Banknote,
      iconColor: "text-[oklch(0.42_0.1_165)]",
      iconBg: "bg-[oklch(0.95_0.03_165)]",
    },
    {
      title: "Reservas Confirmadas",
      value: stats.confirmedBookings.toLocaleString("es-AR"),
      note: "Estado actual: Confirmada",
      icon: CheckCircle,
      iconColor: "text-[oklch(0.5_0.12_145)]",
      iconBg: "bg-[oklch(0.95_0.04_145)]",
    },
    {
      title: "Noches Vendidas",
      value: stats.totalNights.toLocaleString("es-AR"),
      note: "Noches totales de estadia",
      icon: BedDouble,
      iconColor: "text-[oklch(0.5_0.09_240)]",
      iconBg: "bg-[oklch(0.95_0.02_240)]",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className="gap-4 border-[oklch(0.9_0.01_80)]/90 bg-white/80 py-5 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.8)]"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-0">
              <CardTitle className="text-sm font-medium text-[oklch(0.4_0.02_250)]">
                {card.title}
              </CardTitle>
              <span
                className={`grid h-8 w-8 shrink-0 place-content-center rounded-lg ${card.iconBg}`}
              >
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight text-[oklch(0.27_0.02_250)]">
                {card.value}
              </div>
              <p className="mt-1 text-xs text-[oklch(0.53_0.02_250)]">{card.note}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
