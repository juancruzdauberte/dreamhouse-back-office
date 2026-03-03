import { DIContainer } from "../../core/DiContainer";
import { KPICards } from "../../components/dashboard/KPICards";
import { RevenueBarChart } from "../../components/dashboard/RevenueBarChart";
import { BookingsLineChart } from "../../components/dashboard/BookingsLineChart";
import { ChannelPieChart } from "../../components/dashboard/ChannelPieChart";
import { DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const bookingRepo = DIContainer.getBookingRepository();

  // Fetch all dashboard data concurrently
  const [stats, revenueData, bookingsData, channelsData] = await Promise.all([
    bookingRepo.getBookingStats(),
    bookingRepo.getRevenueByMonthUSD(),
    bookingRepo.getBookingsByMonth(),
    bookingRepo.getBookingsByChannel(),
  ]);

  return (
    <div className="min-h-screen p-6 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold text-slate-800">
            Dashboard de Análisis
          </h1>
          <p className="text-slate-500 mt-2">
            Métricas y rendimiento de Dreamhouse
          </p>
        </div>

        {/* KPIs Cards Section */}
        <section>
          <KPICards stats={stats} />
        </section>

        {/* Charts Section */}
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
