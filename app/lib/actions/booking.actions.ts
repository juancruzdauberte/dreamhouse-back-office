"use server";
import { CreateBookingSchema } from "../schema/booking.schema";
import { DIContainer } from "../../core/DiContainer";

export async function createBooking(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    // Convertir fechas a formato YYYY-MM-DD para evitar problemas de zona horaria
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;

    const booking = CreateBookingSchema.parse({
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_state: "Confirmada",
      comission: formData.get("comission"),
      prepayment_ars: formData.get("prepayment_ars"),
    });

    await DIContainer.getBookingRepository().createBooking(booking);

    return { success: true, message: "Reserva creada exitosamente" };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al crear la reserva",
    };
  }
}
