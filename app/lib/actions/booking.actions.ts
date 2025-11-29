"use server";
import {
  CreateBookingSchema,
  UpdateBookingSchema,
} from "../schema/booking.schema";
import { DIContainer } from "../../core/DiContainer";

const { revalidatePath } = await import("next/cache");

export async function createBooking(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;

    // Convert null values to empty strings for optional fields
    const comissionValue = formData.get("comission");

    const booking = CreateBookingSchema.parse({
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_total_price_ars: formData.get("booking_total_price_ars"),
      prepayment_usd: formData.get("prepayment_usd"),
      booking_state: "Confirmada",
      comission: comissionValue === null ? "" : comissionValue,
      prepayment_ars: formData.get("prepayment_ars"),
    });

    await DIContainer.getBookingRepository().createBooking(booking);
    revalidatePath("/");
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

export async function updateBooking(
  formData: FormData
): Promise<{ success: boolean; message: string }> {
  try {
    const checkInStr = formData.get("check_in") as string;
    const checkOutStr = formData.get("check_out") as string;

    // Convert null values to empty strings for optional fields
    const comissionValue = formData.get("comission");
    const balancepaymentValue = formData.get("balancepayment_ars");

    const booking = UpdateBookingSchema.parse({
      id: formData.get("id"),
      tenant_name: formData.get("tenant_name"),
      check_in: checkInStr,
      check_out: checkOutStr,
      channel_id: formData.get("channel_id"),
      tenant_quantity: formData.get("tenant_quantity"),
      booking_adv: formData.get("booking_adv") === "true",
      booking_total_price_usd: formData.get("booking_total_price_usd"),
      booking_total_price_ars: formData.get("booking_total_price_ars"),
      booking_state: formData.get("booking_state"),
      comission: comissionValue === null ? "" : comissionValue,
      prepayment_ars: formData.get("prepayment_ars"),
      prepayment_usd: formData.get("prepayment_usd"),
      balancepayment_ars:
        balancepaymentValue === null ? "" : balancepaymentValue,
      balancepayment_usd: formData.get("balancepayment_usd"),
    });

    await DIContainer.getBookingRepository().updateBooking(booking);
    revalidatePath("/");
    return { success: true, message: "Reserva actualizada exitosamente" };
  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al crear la reserva",
    };
  }
}

export async function deleteBooking(
  bookingId: number
): Promise<{ success: boolean; message: string }> {
  try {
    await DIContainer.getBookingRepository().deleteBooking(bookingId);
    revalidatePath("/");

    return { success: true, message: "Reserva eliminada exitosamente" };
  } catch (error) {
    console.error("Error deleting booking:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Error al eliminar la reserva",
    };
  }
}
