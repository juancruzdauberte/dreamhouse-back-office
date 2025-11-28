import z from "zod";

export const CreateBookingSchema = z.object({
  tenant_name: z.string(),
  channel_id: z.coerce.number(),
  check_in: z.string(),
  check_out: z.string(),
  booking_state: z.string(),
  booking_adv: z.boolean(),
  booking_total_price_usd: z.coerce.number(),
  tenant_quantity: z.coerce.number(),
  comission: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number()),
  prepayment_ars: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number()),
});

export const UpdateBookingSchema = z.object({
  id: z.coerce.number().optional(),
  tenant_name: z.string().optional(),
  channel_id: z.coerce.number().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  booking_state: z.string().optional(),
  booking_adv: z.boolean().optional(),
  booking_total_price_usd: z.coerce.number().optional(),
  tenant_quantity: z.coerce.number().optional(),
  comission: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number())
    .optional(),
  prepayment_ars: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number())
    .optional(),
  balancepayment_ars: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return 0;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number())
    .optional(),
});
