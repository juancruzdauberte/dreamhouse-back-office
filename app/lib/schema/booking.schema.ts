import z from "zod";

// NOTE: CreateBookingSchema validates ONLY the fields provided by the CREATE form.
// Calculated fields (anticipo, saldo, comission, etc.) are NOT in this schema.
// The database triggers calculate them automatically.
// booking_state is hardcoded to "Confirmada" in the action.
export const CreateBookingSchema = z.object({
  tenant_name: z.string(),
  channel_id: z.coerce.number(),
  check_in: z.string(),
  check_out: z.string(),
  booking_adv: z.boolean(),
  booking_total_price_usd: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable()),
  booking_total_price_ars: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable()),
  tenant_quantity: z.coerce.number(),
  guest_phone: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return val;
    })
    .pipe(z.string().nullable()),
  noon: z.boolean().optional(),
  observations: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === null || val === undefined ? null : val))
    .pipe(z.string().nullable())
    .optional(),
});

// NOTE: UpdateBookingSchema validates ONLY the fields provided by the UPDATE form.
// Calculated fields are NOT included (trigger handles them).
export const UpdateBookingSchema = z.object({
  id: z.coerce.number(),
  tenant_name: z.string().optional(),
  channel_id: z.coerce.number().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  booking_state: z.string().optional(),
  booking_adv: z.boolean().optional(),
  guest_phone: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return val;
    })
    .pipe(z.string().nullable())
    .optional(),
  booking_total_price_usd: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  booking_total_price_ars: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  tenant_quantity: z.coerce.number().optional(),
  noon: z.boolean().optional(),
  observations: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === null || val === undefined ? null : val))
    .pipe(z.string().nullable())
    .optional(),
});
