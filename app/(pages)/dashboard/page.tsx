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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,oklch(0.97_0.03_75),transparent_38%),radial-gradient(circle_at_90%_0%,oklch(0.95_0.03_235),transparent_35%),oklch(0.99_0.005_80)] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        <section>
          <KPICards stats={stats} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2 min-w-0">
            <RevenueBarChart data={revenueData} />
          </div>
          <div className="col-span-1 lg:col-span-1 min-w-0">
            <ChannelPieChart data={channelsData} />
          </div>
          <div className="col-span-1 lg:col-span-2 min-w-0">
            <BookingsLineChart data={bookingsData} />
          </div>
        </section>
      </div>
    </div>
  );
}
