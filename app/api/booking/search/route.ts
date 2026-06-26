import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DIContainer } from "@/app/core/DiContainer";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repo = DIContainer.getBookingRepository();
    const bookings = await repo.getAllBookingsForSearch();
    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings for search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
