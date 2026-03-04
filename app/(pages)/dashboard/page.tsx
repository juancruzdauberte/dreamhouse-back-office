import { DIContainer } from "../../core/DiContainer";
import { KPICards } from "../../components/dashboard/KPICards";
import { RevenueBarChart } from "../../components/dashboard/RevenueBarChart";
import { BookingsLineChart } from "../../components/dashboard/BookingsLineChart";
import { ChannelPieChart } from "../../components/dashboard/ChannelPieChart";

export default async function DashboardPage() {
  const bookingRepo = DIContainer.getBookingRepository();

  const [stats, revenueData, bookingsData, channelsData] = await Promise.all([
    bookingRepo.getBookingStats(),
    bookingRepo.getRevenueByMonthUSD(),
    bookingRepo.getBookingsByMonth(),
    bookingRepo.getBookingsByChannel(),
  ]);

  const reportDate = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,oklch(0.97_0.03_75),transparent_38%),radial-gradient(circle_at_90%_0%,oklch(0.95_0.03_235),transparent_35%),oklch(0.99_0.005_80)] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        <section className="relative overflow-hidden rounded-2xl border border-[oklch(0.88_0.015_80)]/80 bg-white/70 p-5 shadow-[0_16px_50px_-38px_rgba(15,23,42,0.45)] backdrop-blur-sm md:p-7">
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[oklch(0.5_0.04_80)]">
                Centro operativo
              </p>
              <h1 className="text-3xl font-bold text-[oklch(0.26_0.02_250)] text-balance md:text-4xl">
                Dashboard de Análisis
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[oklch(0.5_0.02_250)] md:text-base">
                Métricas clave de reservas, ingresos y canales para supervisar
                el rendimiento de Dreamhouse.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="rounded-xl border border-[oklch(0.9_0.01_80)] bg-[oklch(0.99_0.003_80)] px-3 py-2">
                <p className="text-[oklch(0.55_0.02_250)]">Actualizado</p>
                <p className="mt-0.5 font-semibold text-[oklch(0.3_0.02_250)]">
                  {reportDate}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col">
          <h2 className="text-lg font-semibold text-[oklch(0.3_0.02_250)] md:text-xl">
            Indicadores principales
          </h2>
          <p className="mt-1 text-sm text-[oklch(0.55_0.02_250)]">
            Visión general de KPIs financieros y ocupación.
          </p>
        </div>

        <section>
          <KPICards stats={stats} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2">
            <RevenueBarChart data={revenueData} />
          </div>
          <div className="col-span-1 lg:col-span-1">
            <ChannelPieChart data={channelsData} />
          </div>
          <div className="col-span-1 lg:col-span-2">
            <BookingsLineChart data={bookingsData} />
          </div>
        </section>
      </div>
    </div>
  );
}
