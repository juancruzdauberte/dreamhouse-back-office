"use client";

import { useState } from "react";
import { PropertyDTO } from "../../lib/repository/property/property.dto";
import { Plus } from "lucide-react";
import PropertyCard from "./PropertyCard";
import PropertyFormModal from "./PropertyFormModal";

interface PropertiesPageClientProps {
  initialProperties: PropertyDTO[];
}

export default function PropertiesPageClient({
  initialProperties,
}: PropertiesPageClientProps) {
  const [properties, setProperties] =
    useState<PropertyDTO[]>(initialProperties);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedPropertyId, setExpandedPropertyId] = useState<number | null>(
    null,
  );
  const [editingPropertyId, setEditingPropertyId] = useState<number | null>(
    null,
  );

  const handlePropertyCreated = (newProperty: PropertyDTO) => {
    setProperties([...properties, newProperty]);
    setIsCreateModalOpen(false);
  };

  const handlePropertyUpdated = (updatedProperty: PropertyDTO) => {
    setProperties((prevProperties) => {
      return prevProperties.map((p) => {
        if (p.id === updatedProperty.id) {
          return updatedProperty;
        }
        return p;
      });
    });

    setEditingPropertyId(null);
    setExpandedPropertyId(null);
  };

  const handleCardClick = (propertyId: number) => {
    if (expandedPropertyId === propertyId) {
      setExpandedPropertyId(null);
      setEditingPropertyId(null);
    } else {
      setExpandedPropertyId(propertyId);
      setEditingPropertyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Propiedades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {properties.length}{" "}
            {properties.length === 1 ? "propiedad" : "propiedades"}
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-base hover:bg-green-700 active:bg-green-800 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Crear Propiedad
        </button>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            isExpanded={expandedPropertyId === property.id}
            isEditing={editingPropertyId === property.id}
            onCardClick={() => handleCardClick(property.id)}
            onEditClick={() => setEditingPropertyId(property.id)}
            onEditClose={() => setEditingPropertyId(null)}
            onPropertyUpdated={handlePropertyUpdated}
          />
        ))}
      </div>

      {/* Empty state */}
      {properties.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-4">
            No hay propiedades registradas
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-base hover:bg-green-700 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear la primera propiedad
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <PropertyFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePropertyCreated}
      />
    </div>
  );
}
