import z from "zod";

export const CreateBookingSchema = z.object({
  tenant_name: z.string(),
  channel_id: z.coerce.number(),
  check_in: z.string(),
  check_out: z.string(),
  booking_state: z.string(),
  booking_adv: z.boolean(),
  booking_total_price_usd: z.coerce.number(),
  tenant_cuantity: z.coerce.number(),
  comission: z.coerce.number(),
});
