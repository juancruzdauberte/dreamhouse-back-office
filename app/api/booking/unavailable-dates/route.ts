import { DIContainer } from "../../../core/DiContainer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const propertyId = request.nextUrl.searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 },
      );
    }

    const bookingRepository = DIContainer.getBookingRepository();
    const allBookings = await bookingRepository.getAllBookings();

    // Filter bookings by property
    const propertyBookings = allBookings.filter(
      (booking) => booking.property_id === Number(propertyId),
    );

    // Extract unavailable dates (confirmed, pending, and realized bookings)
    const unavailableDates = propertyBookings
      .filter(
        (booking) =>
          booking.status === "Confirmada" ||
          booking.status === "Pendiente" ||
          booking.status === "Realizada",
      )
      .map((booking) => ({
        check_in: booking.check_in,
        check_out: booking.check_out,
      }));

    return NextResponse.json(unavailableDates);
  } catch (error) {
    console.error("Error fetching unavailable dates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
