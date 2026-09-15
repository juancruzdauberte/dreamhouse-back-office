export interface CreateBookingDTO {
  tenant_name: string;
  check_in: string;
  check_out: string;
  channel_id: number;
  tenant_quantity: number;
  booking_adv: boolean;
  booking_total_price_usd?: number | null;
  booking_total_price_ars?: number | null;
  guest_phone?: string | null;
  noon?: boolean;
  observations?: string | null;
  // NOTE: The following are calculated by database triggers and NOT provided by the client:
  // - monto_anticipo_usd (30% of precio_total)
  // - monto_saldo_usd (70% of precio_total)
  // - comision_canal_usd (from channel %)
  // - pago_anticipo_ars (from TC * monto_anticipo_usd)
  // - pago_saldo_ars (from TC * monto_saldo_usd)
  // - booking_state (hardcoded to "Confirmada")
  
  // DEPRECATED (kept for backward compatibility with form, but ignored):
  prepayment_usd?: number | null;
  prepayment_ars?: number | null;
  comission?: number | null;
}

export interface BookingDTO {
  id: number;
  booking_date: string;
  check_in: string;
  check_out: string;
  channel_name: string;
  guest_count: number;
  nights_stay: number;
  status: string;
  guest_name: string;
  price_per_night_usd: string;
  total_price_usd: string;
  deposit_amount_usd: string;
  balance_amount_usd: string;
  deposit_payment_ars: string;
  deposit_exchange_rate: string | null;
  balance_payment_ars: string | null;
  balance_exchange_rate: string | null;
  channel_commission_usd: string;
  advertising_booking: number;
  total_price_ars: string | null;
  guest_phone: string | null;
  noon: number;
  observations: string | null;
  google_event_id?: string | null;
}

export interface UpdateBookingDTO {
  id?: number;
  tenant_name?: string;
  check_in?: string;
  check_out?: string;
  channel_id?: number;
  tenant_quantity?: number;
  booking_adv?: boolean;
  booking_total_price_usd?: number | null;
  booking_total_price_ars?: number | null;
  booking_state?: string;
  guest_phone?: string | null;
  noon?: boolean;
  observations?: string | null;
  // NOTE: The following are calculated by database triggers and NOT provided by the client:
  // - monto_anticipo_usd (30% of precio_total)
  // - monto_saldo_usd (70% of precio_total)
  // - comision_canal_usd (from channel % or original value)
  // - pago_anticipo_ars (from TC * monto_anticipo_usd)
  // - pago_saldo_ars (from TC * monto_saldo_usd)
  
  // DEPRECATED (kept for backward compatibility with form, but ignored):
  prepayment_ars?: number | null;
  prepayment_usd?: number | null;
  balancepayment_ars?: number | null;
  balancepayment_usd?: number | null;
  comission?: number | null;
  deposit_exchange_rate?: number | null;
  balance_exchange_rate?: number | null;
}

export interface ChannelDTO {
  id: number;
  channel_name: string;
}

export interface BookingDatesDTO {
  check_in: string;
  check_out: string;
}

export interface RevenueByMonthDTO {
  month: string;
  revenue: number;
}

export interface BookingsByMonthDTO {
  month: string;
  bookings: number;
}

export interface BookingsByChannelDTO {
  channel_name: string;
  bookings: number;
}

/** Lean projection used by the search bar — 6 fields only. */
export interface BookingSearchDTO {
  id: number;
  guest_name: string;
  channel_name: string;
  check_in: string;
  check_out: string;
  status: string;
}
