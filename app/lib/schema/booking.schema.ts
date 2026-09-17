import z from "zod";

// NOTE: CreateBookingSchema validates ONLY the fields provided by the CREATE form.
// Calculated fields (balance, comission, etc.) are NOT in this schema.
// The database triggers calculate them automatically.
// booking_state is hardcoded to "Confirmada" in the action.
// property_id is REQUIRED and tied to a property in dim_propiedades.
//
// CAMPOS DE ANTICIPO/DEPÓSITO:
//   - deposit_amount_usd: depósito personalizado en USD (opcional, 30% por defecto)
//   - deposit_amount_ars: depósito personalizado en ARS (opcional, 30% por defecto)
//
// CAMPOS DE TIPO DE CAMBIO:
//   - tipo_cambio: SOLO INFORMATIVO en el cliente. No se persiste ni se usa en lógica BD.
//     Se usa solo para mostrar el equivalente en USD de una reserva en ARS.
// PROPERTY SELECTION:
//   - property_id es OBLIGATORIO. Selecciona a qué propiedad/casa pertenece la reserva.
export const CreateBookingSchema = z.object({
  property_id: z.coerce.number().int().positive("Property ID debe ser un número positivo"),
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
  // Depósito personalizado (opcional, trigger calcula 30% si no se proporciona)
  deposit_amount_usd: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  deposit_amount_ars: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  deposit_exchange_rate: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
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
    .transform((val) =>
      val === "" || val === null || val === undefined ? null : val,
    )
    .pipe(z.string().nullable())
    .optional(),
});

// NOTE: UpdateBookingSchema validates ONLY the fields provided by the UPDATE form.
// Calculated fields are NOT included (trigger handles them).
// property_id es OPCIONAL en edición (puede cambiar a qué propiedad pertenece).
export const UpdateBookingSchema = z.object({
  id: z.coerce.number(),
  property_id: z.coerce.number().int().positive("Property ID debe ser un número positivo").optional(),
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
  // Depósito personalizado (opcional, trigger calcula 30% si no se proporciona)
  deposit_amount_usd: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  deposit_amount_ars: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  deposit_exchange_rate: z
    .union([z.string(), z.number(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === "" || val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .pipe(z.number().nullable())
    .optional(),
  balance_exchange_rate: z
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
    .transform((val) =>
      val === "" || val === null || val === undefined ? null : val,
    )
    .pipe(z.string().nullable())
    .optional(),
});
