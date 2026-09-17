"use client";

import { PropertyDTO } from "../../lib/repository/property/property.dto";
import { ChevronDown, Users } from "lucide-react";
import PropertyDropdown from "./PropertyDropdown";

interface PropertyCardProps {
  property: PropertyDTO;
  isExpanded: boolean;
  isEditing: boolean;
  onCardClick: () => void;
  onEditClick: () => void;
  onEditClose: () => void;
  onPropertyUpdated: (property: PropertyDTO) => void;
}

export default function PropertyCard({
  property,
  isExpanded,
  isEditing,
  onCardClick,
  onEditClick,
  onEditClose,
  onPropertyUpdated,
}: PropertyCardProps) {
  return (
    <div className="space-y-0">
      {/* Card Main */}
      <button
        onClick={onCardClick}
        className="w-full text-left bg-white rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 cursor-pointer"
      >
        <div className="p-5 md:p-6">
          {/* Header with name and status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                {property.name}
              </h3>
              <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                {property.description || "Sin descripción"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  property.status === "activa"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {property.status === "activa" ? "Activa" : "Inactiva"}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-slate-600 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-600">Capacidad</p>
                <p className="font-semibold text-slate-800">
                  {property.max_guests}{" "}
                  {property.max_guests === 1 ? "huésped" : "huéspedes"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {isExpanded && (
        <PropertyDropdown
          property={property}
          isEditing={isEditing}
          onEditClick={onEditClick}
          onEditClose={onEditClose}
          onPropertyUpdated={onPropertyUpdated}
        />
      )}
    </div>
  );
}
