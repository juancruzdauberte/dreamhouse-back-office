"use server";

export async function createPropertyAction(formData: FormData) {
  const { DIContainer } = await import("../../core/DiContainer");
  const { revalidatePath } = await import("next/cache");
  const { CreatePropertySchema } = await import("../schema/property.schema");

  try {
    const property = CreatePropertySchema.parse({
      name: formData.get("name"),
      description: formData.get("description"),
      max_guests: formData.get("max_guests"),
    });

    const propertyId =
      await DIContainer.getPropertyRepository().createProperty(property);

    revalidatePath("/properties");
    return {
      success: true,
      message: "Propiedad creada exitosamente",
      propertyId,
    };
  } catch (error) {
    console.error("Error creating property:", error);
    return {
      success: false,
      message: "Error al crear la propiedad",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updatePropertyAction(formData: FormData) {
  const { DIContainer } = await import("../../core/DiContainer");
  const { revalidatePath } = await import("next/cache");
  const { UpdatePropertySchema } = await import("../schema/property.schema");

  try {
    const propertyId = Number(formData.get("id"));

    const property = UpdatePropertySchema.parse({
      id: propertyId,
      name: formData.get("name"),
      description: formData.get("description"),
      max_guests: formData.get("max_guests"),
      status: formData.get("status"),
    });

    const updatedPropertyId =
      await DIContainer.getPropertyRepository().updateProperty(property);

    revalidatePath("/properties");

    return {
      success: true,
      message: "Propiedad actualizada exitosamente",
      propertyId: updatedPropertyId,
    };
  } catch (error) {
    console.error("Error updating property:", error);
    return {
      success: false,
      message: "Error al actualizar la propiedad",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
