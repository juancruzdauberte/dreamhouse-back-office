"use client";

import { useState } from "react";
import { BookingDTO} from "../lib/repository/booking/booking.dto";
import CalendarComponent from "./CalendarComponent";
import PropertyFilterCalendar from "./PropertyFilterCalendar";
import { PropertyDTO } from "../lib/repository/property/property.dto";

interface BookingsPageClientProps {
  bookings: BookingDTO[];
  properties: PropertyDTO[];
  initialDate?: string;
}

export default function BookingsPageClient({
  bookings,
  properties,
  initialDate,
}: BookingsPageClientProps) {
  // State to track filtered bookings based on property selection
  const [filteredBookings, setFilteredBookings] = useState<BookingDTO[]>(bookings);

  const handleFilterChange = (filtered: BookingDTO[]) => {
    setFilteredBookings(filtered);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Property Filter */}
      <PropertyFilterCalendar
        bookings={bookings}
        properties={properties}
        onFilterChange={handleFilterChange}
      />

      {/* Calendar with filtered bookings */}
      <CalendarComponent
        bookings={filteredBookings}
        initialDate={initialDate}
      />
    </div>
  );
}
