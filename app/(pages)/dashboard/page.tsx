import { DashboardClient } from "../../components/dashboard/DashboardClient";
import { DIContainer } from "../../core/DiContainer";

export default async function DashboardPage() {
  const bookingRepo = DIContainer.getBookingRepository();
  const propertyRepo = DIContainer.getPropertyRepository();

  // Fetch global data (shown by default)
  const [stats, revenueData, bookingsData, channelsData, properties] =
    await Promise.all([
      bookingRepo.getBookingStats(),
      bookingRepo.getRevenueByMonthUSD(),
      bookingRepo.getBookingsByMonth(),
      bookingRepo.getBookingsByChannel(),
      propertyRepo.getProperties(),
    ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,oklch(0.97_0.03_75),transparent_38%),radial-gradient(circle_at_90%_0%,oklch(0.95_0.03_235),transparent_35%),oklch(0.99_0.005_80)] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        <DashboardClient
          initialStats={stats}
          initialRevenueData={revenueData}
          initialBookingsData={bookingsData}
          initialChannelsData={channelsData}
          properties={properties}
        />
      </div>
    </div>
  );
}
