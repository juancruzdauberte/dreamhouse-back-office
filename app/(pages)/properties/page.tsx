import PropertiesPageClient from "../../components/properties/PropertiesPageClient";

export default async function PropertiesPage() {
  const { DIContainer } = await import("../../core/DiContainer");
  const propertyRepository = DIContainer.getPropertyRepository();
  const properties = await propertyRepository.getProperties();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_18%,oklch(0.97_0.03_75),transparent_38%),radial-gradient(circle_at_90%_0%,oklch(0.95_0.03_235),transparent_35%),oklch(0.99_0.005_80)] px-4 py-5 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <PropertiesPageClient initialProperties={properties} />
      </div>
    </div>
  );
}
