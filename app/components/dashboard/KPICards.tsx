import {
  DollarSign,
  Banknote,
  CheckCircle,
  BedDouble,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface KPICardsProps {
  stats: any;
  propertyName?: string;
}

export function KPICards({ stats, propertyName }: KPICardsProps) {
  // Handle both old-style (camelCase) and new-style (snake_case) property names
  const totalRevenueUSD = stats?.total_revenue_usd ?? stats?.totalRevenue ?? 0;
  const totalRevenueARS =
    stats?.total_revenue_ars ?? stats?.totalRevenueArs ?? 0;
  const convertedArsToUSD =
    stats?.converted_ars_to_usd ?? stats?.totalRevenueArs ?? 0;
  const confirmedBookings =
    stats?.confirmed_bookings ?? stats?.confirmedBookings ?? 0;
  const totalNights = stats?.total_nights ?? stats?.totalNights ?? 0;
  const totalGuestsNights = stats?.total_guests_nights ?? 0;
  const totalIngresos = totalRevenueUSD + convertedArsToUSD;
  const avgPerNightTotal = totalNights > 0 ? totalIngresos / totalNights : 0;
  const avgPerPersonPerNightTotal =
    totalGuestsNights > 0 ? totalIngresos / totalGuestsNights : 0;

  const formatNumber = (num: number | undefined): string => {
    if (!num && num !== 0) return "0";
    return Number(num).toLocaleString("es-AR");
  };

  const formatDecimal = (num: number | undefined): string => {
    if (!num && num !== 0) return "0.00";
    return Number(num).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const cards = [
    {
      title: "Ingresos totales USD",
      value: `$${formatNumber(totalIngresos)}`,
      subtitle: "USD",
      note: "USD + ARS convertido a USD",
      icon: DollarSign,
      iconColor: "text-[oklch(0.45_0.12_55)]",
      iconBg: "bg-[oklch(0.95_0.03_80)]",
    },
    {
      title: "Ingresos USD",
      value: `$${formatNumber(totalRevenueUSD)}`,
      subtitle: "USD",
      note: "Suma total cotizada en USD",
      icon: DollarSign,
      iconColor: "text-[oklch(0.45_0.12_55)]",
      iconBg: "bg-[oklch(0.95_0.03_80)]",
    },
    {
      title: "Ingresos ARS (cotizado)",
      value: `$${formatNumber(totalRevenueARS)}`,
      subtitle: "ARS",
      note: "Suma total cotizada en ARS",
      icon: Banknote,
      iconColor: "text-[oklch(0.42_0.1_165)]",
      iconBg: "bg-[oklch(0.95_0.03_165)]",
    },
    {
      title: "Reservas Confirmadas",
      value: formatNumber(confirmedBookings),
      subtitle: "",
      note: "Estado actual: Confirmada",
      icon: CheckCircle,
      iconColor: "text-[oklch(0.5_0.12_145)]",
      iconBg: "bg-[oklch(0.95_0.04_145)]",
    },
    {
      title: "Noches Vendidas",
      value: formatNumber(totalNights),
      subtitle: "",
      note: "Noches totales de estadía",
      icon: BedDouble,
      iconColor: "text-[oklch(0.5_0.09_240)]",
      iconBg: "bg-[oklch(0.95_0.02_240)]",
    },
    {
      title: "Promedio por Noche (Total USD)",
      value: `$${formatDecimal(avgPerNightTotal)}`,
      subtitle: "USD",
      note: "USD + ARS convertido a USD ÷ noches",
      icon: BedDouble,
      iconColor: "text-[oklch(0.45_0.12_25)]",
      iconBg: "bg-[oklch(0.95_0.03_25)]",
    },
    {
      title: "Promedio por Persona/Noche (Total USD)",
      value: `$${formatDecimal(avgPerPersonPerNightTotal)}`,
      subtitle: "USD",
      note: "USD + ARS convertido a USD ÷ (noches × huéspedes)",
      icon: Users,
      iconColor: "text-[oklch(0.45_0.12_300)]",
      iconBg: "bg-[oklch(0.95_0.03_300)]",
    },
  ];

  return (
    <div className="space-y-3">
      {propertyName && (
        <div className="text-lg font-semibold text-[oklch(0.3_0.02_250)]">
          📍 {propertyName}
        </div>
      )}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.title}
              className="gap-4 border-[oklch(0.9_0.01_80)]/90 bg-white/80 py-5 shadow-[0_14px_30px_-30px_rgba(15,23,42,0.8)]"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-0">
                <div className="flex flex-col gap-1 flex-1">
                  <CardTitle className="text-xs font-medium text-[oklch(0.4_0.02_250)]">
                    {card.title}
                  </CardTitle>
                  {card.subtitle && (
                    <span className="text-xs text-[oklch(0.53_0.02_250)] font-normal">
                      {card.subtitle}
                    </span>
                  )}
                </div>
                <span
                  className={`grid h-8 w-8 shrink-0 place-content-center rounded-lg ${card.iconBg}`}
                >
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold tracking-tight text-[oklch(0.27_0.02_250)]">
                  {card.value}
                </div>
                <p className="mt-1 text-xs text-[oklch(0.53_0.02_250)]">
                  {card.note}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
