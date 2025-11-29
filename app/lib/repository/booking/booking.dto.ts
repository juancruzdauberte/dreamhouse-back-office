export interface CreateBookingDTO {
  tenant_name: string;
  check_in: string;
  check_out: string;
  channel_id: number;
  tenant_quantity: number;
  booking_adv: boolean;
  booking_total_price_usd?: number | null;
  booking_total_price_ars?: number | null;
  comission?: number | null;
  prepayment_ars?: number | null;
  prepayment_usd?: number | null;
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
  comission?: number | null;
  prepayment_ars?: number | null;
  prepayment_usd?: number | null;
  balancepayment_ars?: number | null;
  balancepayment_usd?: number | null;
  booking_state?: string;
}

export interface ChannelDTO {
  id: number;
  channel_name: string;
}

export interface BookingDatesDTO {
  check_in: string;
  check_out: string;
}
