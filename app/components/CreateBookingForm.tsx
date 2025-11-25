import { DIContainer } from "../core/DiContainer";
import { BookingFormClient } from "./BookingFormClient";

export default async function CreateBookingForm() {
  try {
    const channels = await DIContainer.getBookingRepository().getChannels();
    const datesUnavailable =
      await DIContainer.getBookingRepository().getBookingsDate();

    return (
      <BookingFormClient
        channels={channels}
        datesUnavailable={datesUnavailable}
      />
    );
  } catch (error) {
    console.error("Error loading booking form:", error);
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-2">
            Error de Conexión
          </h2>
          <p className="text-red-600">
            No se pudo cargar el formulario. Verifica la configuración de la
            base de datos.
          </p>
          <p className="text-sm text-red-500 mt-2">
            {error instanceof Error ? error.message : "Error desconocido"}
          </p>
        </div>
      </div>
    );
  }
}
