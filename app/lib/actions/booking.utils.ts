/**
 * Utility functions for booking actions to eliminate code duplication.
 * These helpers encapsulate calculation logic used by both create and update actions.
 */

import type { CreateBookingDTO, UpdateBookingDTO, BookingDTO } from "../repository/booking/booking.dto";
import type { CalendarEventParams } from "../services/calendar.service";

/**
 * Calculate the total price, deposit amount, and balance.
 * Replicates the same logic as the database trigger for consistency.
 * 
 * @param booking - The booking data (input)
 * @returns Object with isUSD flag, total price, deposit, and balance
 */
export function calculateDepositAndBalance(
  booking: CreateBookingDTO | UpdateBookingDTO
): {
  isUSD: boolean;
  total: number;
  deposit: number;
  balance: number;
} {
  const isUSD = !!booking.booking_total_price_usd;
  const total = isUSD
    ? booking.booking_total_price_usd!
    : booking.booking_total_price_ars!;

  // Use custom deposit if provided, else default to 30%
  // This mirrors the database trigger logic
  const deposit =
    booking.deposit_amount_usd ?? booking.deposit_amount_ars ?? total * 0.3;
  const balance = total - deposit;

  return { isUSD, total, deposit, balance };
}

/**
 * Prepare calendar event parameters from booking data.
 * Consolidates the logic for both create and update flows.
 * 
 * @param booking - The booking data (input)
 * @param currentBooking - The current booking data (for update; optional)
 * @param bookingId - The booking ID
 * @returns Calendar event parameters
 */
export function prepareCalendarEventParams(
  booking: CreateBookingDTO | UpdateBookingDTO,
  bookingId: number,
  currentBooking?: BookingDTO
): CalendarEventParams {
  const { isUSD, total, deposit, balance } = calculateDepositAndBalance(booking);

  // For updates, fallback to current values if not provided
  const isUpdate = currentBooking !== undefined;
  const tenantName = isUpdate
    ? (booking as UpdateBookingDTO).tenant_name ?? currentBooking.guest_name
    : (booking as CreateBookingDTO).tenant_name;

  const checkIn = isUpdate
    ? (booking as UpdateBookingDTO).check_in ?? currentBooking.check_in
    : (booking as CreateBookingDTO).check_in;

  const checkOut = isUpdate
    ? (booking as UpdateBookingDTO).check_out ?? currentBooking.check_out
    : (booking as CreateBookingDTO).check_out;

  const tenantQuantity = isUpdate
    ? (booking as UpdateBookingDTO).tenant_quantity ?? currentBooking.guest_count
    : (booking as CreateBookingDTO).tenant_quantity;

  const bookingState = isUpdate
    ? (booking as UpdateBookingDTO).booking_state ?? currentBooking.status
    : "Confirmada";

  const medioDia = isUpdate
    ? (booking as UpdateBookingDTO).noon ?? false
    : (booking as CreateBookingDTO).noon!;

  return {
    nombreCliente: tenantName,
    fechaCheckIn: checkIn,
    fechaCheckOut: checkOut,
    total,
    pago: deposit,
    faltaPagar: balance,
    huespedes: tenantQuantity,
    estado: bookingState,
    observations: booking.observations ?? null,
    medioDia,
    currency: isUSD ? "USD" : "ARS",
    idBooking: bookingId,
    googleEventId: currentBooking?.google_event_id,
  };
}
