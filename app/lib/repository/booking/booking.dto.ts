export interface CreateBookingDTO {
  property_id: number; // ← NEW: required property
  tenant_name: string;
  check_in: string;
  check_out: string;
  channel_id: number;
  tenant_quantity: number;
  booking_adv: boolean;
  booking_total_price_usd?: number | null;
  booking_total_price_ars?: number | null;
  deposit_amount_usd?: number | null;
  deposit_amount_ars?: number | null;
  deposit_exchange_rate?: number | null;
  guest_phone?: string | null;
  noon?: boolean;
  observations?: string | null;
  comission?: number | null;
}

export interface BookingDTO {
  id: number;
  booking_date: string;
  check_in: string;
  check_out: string;
  channel_name: string;
  property_id: number;
  property_name: string;
  guest_count: number;
  nights_stay: number;
  status: string;
  guest_name: string;
  price_per_night_usd: string;
  total_price_usd: string;
  deposit_amount_usd: string;
  balance_amount_usd: string;
  balance_amount_ars: string;
  deposit_amount_ars: string;
  deposit_exchange_rate: string;
  balance_exchange_rate: string;
  channel_commission_usd: string;
  advertising_booking: number;
  total_price_ars: string | null;
  guest_phone: string | null;
  noon: number;
  observations: string | null;
  google_event_id?: string | null;
}

export interface UpdateBookingDTO {
  property_id?: number;
  id?: number;
  tenant_name?: string;
  check_in?: string;
  check_out?: string;
  channel_id?: number;
  tenant_quantity?: number;
  booking_adv?: boolean;
  booking_total_price_usd?: number | null;
  booking_total_price_ars?: number | null;
  deposit_amount_usd?: number | null;
  deposit_amount_ars?: number | null;
  booking_state?: string;
  guest_phone?: string | null;
  noon?: boolean;
  observations?: string | null;
  balance_amount_ars?: number | null;
  balance_amount_usd?: number | null;
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
  property_name: string;
  check_in: string;
  check_out: string;
  status: string;
}

export interface PropertyStatsDTO {
  total_guests_nights: number;
  property_id: number;
  property_name: string;
  total_revenue_usd: number; // Ingresos totales en USD
  total_revenue_ars: number; // Ingresos totales en ARS (cotización)
  converted_ars_to_usd: number; // Ingresos ARS convertidos a USD usando tipos de cambio
  confirmed_bookings: number;
  total_nights: number;
  avg_price_per_night_usd: number;
  avg_price_per_night_ars: number;
  avg_per_person_per_night_usd: number;
  avg_per_person_per_night_ars: number;
}

/** Revenue by month with property filter, both currencies */
export interface PropertyRevenueByMonthDTO {
  month: string;
  revenue_usd: number;
  revenue_ars: number;
  converted_ars_to_usd: number; // ARS converted to USD using exchange rates
}

/** Bookings by month with property filter */
export interface PropertyBookingsByMonthDTO {
  month: string;
  bookings: number;
}

/** Channel distribution with property filter */
export interface PropertyBookingsByChannelDTO {
  channel_name: string;
  bookings: number;
  revenue_usd: number;
  revenue_ars: number;
  converted_ars_to_usd: number;
}
