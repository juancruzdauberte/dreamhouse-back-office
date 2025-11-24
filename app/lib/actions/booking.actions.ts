"use server";
import { CreateBookingSchema } from "../schema/booking.schema";
import { DIContainer } from "../../core/DiContainer";
export async function createBooking(formData: FormData): Promise<void> {
  const booking = CreateBookingSchema.parse({
    tenant_name: formData.get("tenant_name"),
    check_in: formData.get("check_in"),
    check_out: formData.get("check_out"),
    channel_id: formData.get("channel_id"),
    tenant_cuantity: formData.get("tenant_cuantity"),
    booking_adv: formData.get("booking_adv"),
    booking_total_price_usd: formData.get("booking_total_price_usd"),
    booking_state: "Confirmada",
  });

  await DIContainer.getBookingRepository().createBooking(booking);
}
