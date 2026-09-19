"use client";

import { useState, useRef, useEffect } from "react";
import { PropertyDTO } from "../../lib/repository/property/property.dto";
import { X, ChevronDown } from "lucide-react";

interface PropertyFilterProps {
  onPropertyChange: (propertyIds: number[]) => void;
  selectedPropertyIds: number[];
  properties: PropertyDTO[];
}

export function PropertyFilter({
  onPropertyChange,
  selectedPropertyIds,
  properties,
}: PropertyFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePropertyToggle = (propertyId: number) => {
    const newSelected = selectedPropertyIds.includes(propertyId)
      ? selectedPropertyIds.filter((id) => id !== propertyId)
      : [...selectedPropertyIds, propertyId];

    onPropertyChange(newSelected);
  };

  const handleRemoveProperty = (propertyId: number) => {
    const newSelected = selectedPropertyIds.filter((id) => id !== propertyId);
    onPropertyChange(newSelected);
  };

  const handleSelectAll = () => {
    onPropertyChange(properties.map((p) => p.id));
  };

  const handleDeselectAll = () => {
    onPropertyChange([]);
  };

  const selectedProperties = properties.filter((p) =>
    selectedPropertyIds.includes(p.id),
  );
  const allSelected = selectedPropertyIds.length === properties.length;
  const someSelected = selectedPropertyIds.length > 0;

  return (
    <div className="w-full flex flex-wrap gap-3 items-center">
      {/* Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-[oklch(0.9_0.01_80)]/90 shadow-sm hover:border-[oklch(0.5_0.12_55)]/50 transition-colors whitespace-nowrap"
        >
          <span className="text-sm font-medium text-[oklch(0.3_0.02_250)]">
            Propiedades
          </span>
          <ChevronDown
            className={`w-4 h-4 text-[oklch(0.53_0.02_250)] transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg border border-[oklch(0.9_0.01_80)]/90 shadow-lg min-w-[280px]">
            {properties.length > 0 ? (
              <div className="py-1">
                {/* Todas option */}
                <div className="border-b border-[oklch(0.9_0.01_80)]/90">
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-[oklch(0.95_0.03_80)] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => {
                        if (allSelected) {
                          handleDeselectAll();
                        } else {
                          handleSelectAll();
                        }
                      }}
                      className="w-4 h-4 rounded border-[oklch(0.9_0.01_80)]/90 cursor-pointer accent-[oklch(0.5_0.12_55)]"
                    />
                    <span className="text-sm text-[oklch(0.3_0.02_250)] font-semibold">
                      Todas
                    </span>
                    {allSelected && (
                      <span className="ml-auto text-xs bg-[oklch(0.5_0.12_55)]/20 text-[oklch(0.5_0.12_55)] px-2 py-1 rounded">
                        ✓
                      </span>
                    )}
                  </label>
                </div>

                {/* Individual properties */}
                {properties.map((property) => {
                  const isSelected = selectedPropertyIds.includes(property.id);
                  return (
                    <label
                      key={property.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-[oklch(0.95_0.03_80)] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePropertyToggle(property.id)}
                        className="w-4 h-4 rounded border-[oklch(0.9_0.01_80)]/90 cursor-pointer accent-[oklch(0.5_0.12_55)]"
                      />
                      <span className="text-sm text-[oklch(0.3_0.02_250)] font-medium">
                        {property.name}
                      </span>
                      {isSelected && (
                        <span className="ml-auto text-xs bg-[oklch(0.5_0.12_55)]/20 text-[oklch(0.5_0.12_55)] px-2 py-1 rounded">
                          ✓
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-[oklch(0.53_0.02_250)]">
                No hay propiedades disponibles
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected properties as tags */}
      {selectedProperties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProperties.map((property) => (
            <div
              key={property.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-[oklch(0.5_0.12_55)]/10 border border-[oklch(0.5_0.12_55)]/30 rounded-lg"
            >
              <span className="text-sm font-medium text-[oklch(0.5_0.12_55)]">
                {property.name}
              </span>
              <button
                onClick={() => handleRemoveProperty(property.id)}
                className="text-[oklch(0.5_0.12_55)] hover:text-[oklch(0.5_0.12_55)]/80 cursor-pointer transition-colors p-0.5 hover:bg-[oklch(0.5_0.12_55)]/20 rounded"
                aria-label={`Remover filtro de ${property.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state message */}
      {selectedProperties.length === 0 && (
        <span className="text-sm text-[oklch(0.53_0.02_250)] italic">
          Selecciona propiedades para filtrar
        </span>
      )}
    </div>
  );
}
