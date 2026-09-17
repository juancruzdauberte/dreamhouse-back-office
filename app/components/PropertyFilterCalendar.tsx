"use client";

import { useState, useRef, useEffect } from "react";
import { BookingDTO } from "../lib/repository/booking/booking.dto";
import { X, ChevronDown } from "lucide-react";
import { PropertyDTO } from "../lib/repository/property/property.dto";

interface PropertyFilterCalendarProps {
  bookings: BookingDTO[];
  properties: PropertyDTO[];
  onFilterChange: (filteredBookings: BookingDTO[]) => void;
}

export default function PropertyFilterCalendar({
  bookings,
  properties,
  onFilterChange,
}: PropertyFilterCalendarProps) {
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<Set<number>>(
    new Set(properties.map((p) => p.id)),
  );
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
    const newSelected = new Set(selectedPropertyIds);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedPropertyIds(newSelected);

    // Filter bookings and notify parent
    const filtered = bookings.filter((booking) =>
      newSelected.has(booking.property_id),
    );
    onFilterChange(filtered);
  };

  const handleRemoveProperty = (propertyId: number) => {
    const newSelected = new Set(selectedPropertyIds);
    newSelected.delete(propertyId);
    setSelectedPropertyIds(newSelected);

    // Filter bookings and notify parent
    const filtered = bookings.filter((booking) =>
      newSelected.has(booking.property_id),
    );
    onFilterChange(filtered);
  };

  const handleSelectAll = () => {
    const allIds = new Set(properties.map((p) => p.id));
    setSelectedPropertyIds(allIds);
    onFilterChange(bookings);
  };

  const handleDeselectAll = () => {
    setSelectedPropertyIds(new Set());
    onFilterChange([]);
  };

  const selectedProperties = properties.filter((p) =>
    selectedPropertyIds.has(p.id),
  );
  const allSelected = selectedPropertyIds.size === properties.length;

  return (
    <div className="w-full flex flex-wrap gap-3 items-center">
      {/* Dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-border shadow-sm hover:border-primary/50 transition-colors whitespace-nowrap"
        >
          <span className="text-sm font-medium text-foreground">
            Propiedades
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg border border-border shadow-lg min-w-[250px]">
            {properties.length > 0 ? (
              <div className="py-1">
                {/* Todas option */}
                <div className="border-b border-border">
                  <label className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition-colors">
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
                      className="w-4 h-4 rounded border-border cursor-pointer"
                    />
                    <span className="text-sm text-foreground font-semibold">
                      Todas
                    </span>
                    {allSelected && (
                      <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        ✓
                      </span>
                    )}
                  </label>
                </div>

                {/* Individual properties */}
                {properties.map((property) => {
                  const isSelected = selectedPropertyIds.has(property.id);
                  return (
                    <label
                      key={property.id}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-accent cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePropertyToggle(property.id)}
                        className="w-4 h-4 rounded border-border cursor-pointer"
                      />
                      <span className="text-sm text-foreground font-medium">
                        {property.name}
                      </span>
                      {isSelected && (
                        <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          ✓
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-3 text-sm text-muted-foreground">
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
              className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg"
            >
              <span className="text-sm font-medium text-primary">
                {property.name}
              </span>
              <button
                onClick={() => handleRemoveProperty(property.id)}
                className="text-primary hover:text-primary/80 cursor-pointer transition-colors p-0.5 hover:bg-primary/20 rounded"
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
        <span className="text-sm text-muted-foreground italic">
          Sin propiedades seleccionadas
        </span>
      )}
    </div>
  );
}
