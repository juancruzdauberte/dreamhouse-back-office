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
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Totales (USD)
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalRevenue?.toLocaleString("es-AR")}
          </div>
          <p className="text-xs text-muted-foreground">
            Suma total cotizada en USD
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ingresos Totales (ARS)
          </CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalRevenueArs?.toLocaleString("es-AR")}
          </div>
          <p className="text-xs text-muted-foreground">
            Suma total cotizada en ARS
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Reservas Confirmadas
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.confirmedBookings}</div>
          <p className="text-xs text-muted-foreground">
            Estado Actual: Confirmada
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Noches Vendidas</CardTitle>
          <BedDouble className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalNights}</div>
          <p className="text-xs text-muted-foreground">
            Noches totales de estadía
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
