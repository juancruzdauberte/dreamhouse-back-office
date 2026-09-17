import z from "zod";

export const CreatePropertySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  max_guests: z.coerce
    .number()
    .int()
    .positive("La cantidad máxima de huéspedes debe ser un número positivo"),
});

export const UpdatePropertySchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  max_guests: z.coerce
    .number()
    .int()
    .positive("La cantidad máxima de huéspedes debe ser un número positivo"),
  status: z
    .enum(["activa", "inactiva"], {
      message: "El estado debe ser 'activa' o 'inactiva'",
    })
    .optional(),
});
