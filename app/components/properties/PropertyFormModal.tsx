"use client";

import React, { useState } from "react";
import { PropertyDTO } from "../../lib/repository/property/property.dto";
import { X, Loader2 } from "lucide-react";
import { FormField } from "../FormField";
import { toast } from "react-toastify";
import {
  createPropertyAction,
  updatePropertyAction,
} from "../../lib/actions/property.actions";

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: PropertyDTO;
  onSuccess: (property: PropertyDTO) => void;
}

export default function PropertyFormModal({
  isOpen,
  onClose,
  property,
  onSuccess,
}: PropertyFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isEditing = !!property;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const action = isEditing ? updatePropertyAction : createPropertyAction;

    try {
      const result = await action(formData);

      if (result && typeof result === "object" && "success" in result) {
        if (result.success) {
          // Construye la propiedad actualizada
          const updatedProperty: PropertyDTO = {
            id: property?.id || result.propertyId || 0,
            name: formData.get("name") as string,
            description: (formData.get("description") as string) || null,
            max_guests: Number(formData.get("max_guests")),
            status:
              (formData.get("status") as "activa" | "inactiva") || "activa",
          };

          // Llama al callback del padre
          onSuccess(updatedProperty);

          toast.success(result.message);
          onClose();
          return;
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Error al procesar el formulario");
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 z-50 md:-translate-y-1/2 md:-translate-x-1/2 md:w-[90vw] md:max-w-2xl flex items-end md:items-center justify-center p-4 md:p-0">
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden w-full max-h-[95vh] md:max-h-[90vh] flex flex-col">
          {/* Header - Sticky */}
          <div className="bg-linear-to-r from-amber-600 to-amber-700 px-4 md:px-6 py-4 md:py-5 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h2 className="text-lg md:text-2xl font-bold text-white">
                {isEditing ? "Editar Propiedad" : "Crear Propiedad"}
              </h2>
              <p className="text-amber-100 text-xs md:text-sm mt-0.5">
                {isEditing
                  ? "Actualiza la información de la propiedad"
                  : "Agrega una nueva propiedad a tu portafolio"}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 p-2 cursor-pointer text-white hover:bg-amber-500/30 rounded-lg transition-colors"
            >
              <X className="w-5 md:w-6 h-5 md:h-6" />
            </button>
          </div>

          {/* Content - Scrolleable */}
          <div className="overflow-y-auto flex-1">
            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isEditing && (
                  <input type="hidden" name="id" value={property?.id} />
                )}

                <FormField
                  label="Nombre de la propiedad"
                  name="name"
                  type="text"
                  placeholder="Ej: Casa en la playa"
                  defaultValue={property?.name}
                  required
                />

                <FormField
                  label="Descripción"
                  name="description"
                  type="textarea"
                  placeholder="Ej: Casa moderna con vista al mar"
                  defaultValue={property?.description || ""}
                  rows={3}
                />

                <FormField
                  label="Capacidad máxima de huéspedes"
                  name="max_guests"
                  type="number"
                  placeholder="Ej: 6"
                  defaultValue={property?.max_guests}
                  required
                />

                <FormField
                  label="Estado"
                  name="status"
                  type="select"
                  defaultValue={property?.status || "activa"}
                  options={[
                    { value: "activa", label: "Activa" },
                    { value: "inactiva", label: "Inactiva" },
                  ]}
                  required
                />

                {/* Submit Button */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:bg-green-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 cursor-pointer"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span>
                      {isSubmitting
                        ? "Procesando..."
                        : isEditing
                          ? "Actualizar"
                          : "Crear"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
