export interface CreateBookingDTO {
  tenant_name: string;
  check_in: string;
  check_out: string;
  channel_id: number;
  tenant_quantity: number;
  booking_adv: boolean;
  booking_total_price_usd: number;
  comission?: number;
  prepayment_ars?: number;
}

export interface ChannelDTO {
  id: number;
  channel_name: string;
}

export interface BookingDatesDTO {
  check_in: string;
  check_out: string;
}
