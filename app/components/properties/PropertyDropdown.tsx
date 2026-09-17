"use client";

import React from "react";
import { PropertyDTO } from "../../lib/repository/property/property.dto";
import { Edit2 } from "lucide-react";
import PropertyFormModal from "./PropertyFormModal";

interface PropertyDropdownProps {
  property: PropertyDTO;
  isEditing: boolean;
  onEditClick: () => void;
  onEditClose: () => void;
  onPropertyUpdated: (property: PropertyDTO) => void;
}

export default function PropertyDropdown({
  property,
  isEditing,
  onEditClick,
  onEditClose,
  onPropertyUpdated,
}: PropertyDropdownProps) {
  return (
    <>
      {/* Dropdown content */}
      <div className="bg-white rounded-b-xl border border-t-0 border-border shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
        <div className="p-5 md:p-6 space-y-4">
          {/* Property details */}
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Nombre</p>
              <p className="text-slate-800 font-semibold">{property.name}</p>
            </div>

            {property.description && (
              <div>
                <p className="text-xs text-slate-600 font-medium mb-1">
                  Descripción
                </p>
                <p className="text-slate-800">{property.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">
                Capacidad máxima
              </p>
              <p className="text-slate-800 font-semibold">
                {property.max_guests}{" "}
                {property.max_guests === 1 ? "huésped" : "huéspedes"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-600 font-medium mb-1">Estado</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                  property.status === "activa"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {property.status === "activa" ? "Activa" : "Inactiva"}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={onEditClick}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors active:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Editar Propiedad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <PropertyFormModal
        isOpen={isEditing}
        onClose={onEditClose}
        property={property}
        onSuccess={(updatedProperty) => {
          onPropertyUpdated(updatedProperty);
          onEditClose();
        }}
      />
    </>
  );
}
