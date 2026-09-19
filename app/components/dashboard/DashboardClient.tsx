"use client";

import { useEffect, useState } from "react";
import { KPICards } from "./KPICards";
import { RevenueBarChart } from "./RevenueBarChart";
import { BookingsLineChart } from "./BookingsLineChart";
import { ChannelPieChart } from "./ChannelPieChart";
import { PropertyFilter } from "./PropertyFilter";
import { RevenueComparisonChart } from "./RevenueComparisonChart";
import { PropertyDTO } from "../../lib/repository/property/property.dto";
import {
  fetchPropertyStats,
  fetchPropertyRevenueByMonth,
  fetchPropertyBookingsByMonth,
  fetchPropertyBookingsByChannel,
} from "../../lib/actions/dashboard.actions";

interface DashboardClientProps {
  initialStats: any;
  initialRevenueData: any[];
  initialBookingsData: any[];
  initialChannelsData: any[];
  properties: PropertyDTO[];
}

interface AggregatedStats {
  total_revenue_usd: number;
  total_revenue_ars: number;
  converted_ars_to_usd: number;
  confirmed_bookings: number;
  total_nights: number;
  total_guests_nights: number;
}

export function DashboardClient({
  initialStats,
  initialRevenueData,
  initialBookingsData,
  initialChannelsData,
  properties,
}: DashboardClientProps) {
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [stats, setStats] = useState<any>(initialStats);
  const [revenueData, setRevenueData] = useState<any[]>(initialRevenueData);
  const [bookingsData, setBookingsData] = useState<any[]>(initialBookingsData);
  const [channelsData, setChannelsData] = useState<any[]>(initialChannelsData);
  const [isLoading, setIsLoading] = useState(false);
  const [propertyName, setPropertyName] = useState<string>("");

  // Select all properties by default
  useEffect(() => {
    if (properties.length > 0 && selectedPropertyIds.length === 0) {
      setSelectedPropertyIds(properties.map((p) => p.id));
    }
  }, [properties, selectedPropertyIds.length]);

  useEffect(() => {
    const loadData = async () => {
      // If no properties selected, show global data
      if (selectedPropertyIds.length === 0) {
        setStats(initialStats);
        setRevenueData(initialRevenueData);
        setBookingsData(initialBookingsData);
        setChannelsData(initialChannelsData);
        setPropertyName("");
        setIsLoading(false);
        return;
      }

      // Fetch data for selected properties
      setIsLoading(true);
      try {
        // Fetch data for all selected properties in parallel
        const allData = await Promise.all(
          selectedPropertyIds.map((propertyId) =>
            Promise.all([
              fetchPropertyStats(propertyId),
              fetchPropertyRevenueByMonth(propertyId),
              fetchPropertyBookingsByMonth(propertyId),
              fetchPropertyBookingsByChannel(propertyId),
            ]),
          ),
        );

        // Aggregate stats from all selected properties
        const aggregatedStats = allData.reduce<AggregatedStats>(
          (acc, [propStats, , ,]) => {
            if (propStats) {
              acc.total_revenue_usd += propStats.total_revenue_usd || 0;
              acc.total_revenue_ars += propStats.total_revenue_ars || 0;
              acc.converted_ars_to_usd += propStats.converted_ars_to_usd || 0;
              acc.confirmed_bookings += propStats.confirmed_bookings || 0;
              acc.total_nights += propStats.total_nights || 0;
              acc.total_guests_nights += propStats.total_guests_nights || 0;
            }
            return acc;
          },
          {
            total_revenue_usd: 0,
            total_revenue_ars: 0,
            converted_ars_to_usd: 0,
            confirmed_bookings: 0,
            total_nights: 0,
            total_guests_nights: 0,
          },
        );

        setStats(aggregatedStats);

        // Aggregate revenue data (merge by month)
        const revenueMap = new Map<
          string,
          {
            revenue_usd: number;
            revenue_ars: number;
            converted_ars_to_usd: number;
          }
        >();
        allData.forEach(([, monthlyRevenue]) => {
          monthlyRevenue.forEach((month: any) => {
            const existing = revenueMap.get(month.month) || {
              revenue_usd: 0,
              revenue_ars: 0,
              converted_ars_to_usd: 0,
            };
            revenueMap.set(month.month, {
              revenue_usd: existing.revenue_usd + (month.revenue_usd || 0),
              revenue_ars: existing.revenue_ars + (month.revenue_ars || 0),
              converted_ars_to_usd:
                existing.converted_ars_to_usd +
                (month.converted_ars_to_usd || 0),
            });
          });
        });
        const aggregatedRevenue = Array.from(revenueMap.entries())
          .map(([month, data]) => ({ month, ...data }))
          .sort((a, b) => a.month.localeCompare(b.month));
        setRevenueData(aggregatedRevenue);

        // Aggregate bookings by month
        const bookingsMap = new Map<string, number>();
        allData.forEach(([, , monthlyBookings]) => {
          monthlyBookings.forEach((month: any) => {
            bookingsMap.set(
              month.month,
              (bookingsMap.get(month.month) || 0) + (month.bookings || 0),
            );
          });
        });
        const aggregatedBookings = Array.from(bookingsMap.entries())
          .map(([month, bookings]) => ({ month, bookings }))
          .sort((a, b) => a.month.localeCompare(b.month));
        setBookingsData(aggregatedBookings);

        // Aggregate channels data
        const channelsMap = new Map<
          string,
          {
            bookings: number;
            revenue_usd: number;
            revenue_ars: number;
            converted_ars_to_usd: number;
          }
        >();
        allData.forEach(([, , , channelData]) => {
          channelData.forEach((channel: any) => {
            const existing = channelsMap.get(channel.channel_name) || {
              bookings: 0,
              revenue_usd: 0,
              revenue_ars: 0,
              converted_ars_to_usd: 0,
            };
            channelsMap.set(channel.channel_name, {
              bookings: existing.bookings + (channel.bookings || 0),
              revenue_usd: existing.revenue_usd + (channel.revenue_usd || 0),
              revenue_ars: existing.revenue_ars + (channel.revenue_ars || 0),
              converted_ars_to_usd:
                existing.converted_ars_to_usd +
                (channel.converted_ars_to_usd || 0),
            });
          });
        });
        const aggregatedChannels = Array.from(channelsMap.entries())
          .map(([channel_name, data]) => ({ channel_name, ...data }))
          .sort((a, b) => b.bookings - a.bookings);
        setChannelsData(aggregatedChannels);

        // Set property name display
        const selectedProps = properties.filter((p) =>
          selectedPropertyIds.includes(p.id),
        );
        if (selectedProps.length === 1) {
          setPropertyName(selectedProps[0].name);
        } else {
          setPropertyName(`${selectedProps.length} propiedades seleccionadas`);
        }
      } catch (error) {
        console.error("Error fetching property data:", error);
        // Fallback to initial data on error
        setStats(initialStats);
        setRevenueData(initialRevenueData);
        setBookingsData(initialBookingsData);
        setChannelsData(initialChannelsData);
        setPropertyName("");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [
    selectedPropertyIds,
    initialStats,
    initialRevenueData,
    initialBookingsData,
    initialChannelsData,
    properties,
  ]);

  return (
    <>
      {/* Filter Section */}
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-[oklch(0.3_0.02_250)]">
          Dashboard
        </h1>
        <PropertyFilter
          selectedPropertyIds={selectedPropertyIds}
          onPropertyChange={setSelectedPropertyIds}
          properties={properties}
        />
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="flex items-center justify-center py-8">
          <p className="text-[oklch(0.4_0.02_250)]">Cargando datos...</p>
        </section>
      )}

      {/* KPI Cards */}
      {!isLoading && (
        <section>
          <KPICards stats={stats} propertyName={propertyName} />
        </section>
      )}

      {/* Charts */}
      {!isLoading && (
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2 min-w-0">
            {selectedPropertyIds.length > 0 && revenueData.length > 0 ? (
              <RevenueComparisonChart data={revenueData} />
            ) : (
              <RevenueBarChart data={revenueData} />
            )}
          </div>
          <div className="col-span-1 lg:col-span-1 min-w-0">
            <ChannelPieChart data={channelsData} />
          </div>
          <div className="col-span-1 lg:col-span-2 min-w-0">
            <BookingsLineChart data={bookingsData} />
          </div>
        </section>
      )}
    </>
  );
}
