export interface CreateBookingDTO {
  tenant_name: string;
  check_in: Date;
  check_out: Date;
  channel_id: number;
  tenant_cuantity: number;
  booking_adv: boolean;
  booking_total_price_usd: number;
}

export interface ChannelDTO {
  id: number;
  channel_name: string;
}

export interface BookingDatesDTO {
  check_in: Date;
  check_out: Date;
}
