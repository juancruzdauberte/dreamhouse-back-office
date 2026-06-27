// Client-safe types and helpers — NO Node.js imports here

export interface AirbnbInquiry {
  uid: number;
  fechaRecibido: Date;
  nombreHuesped: string;
  fechaIngreso: Date | null;
  fechaSalida: Date | null;
  adultos: number;
  menores: number;
  mascotas: number;
  mensaje: string;
  ingresos: string;
  airbnbUrl: string;
}

export interface BookingInquiry {
  uid: number;
  fechaRecibido: Date;
  fechaLimite: string;
  fechaIngreso: Date | null;
  fechaSalida: Date | null;
  noches: number;
  adultos: number;
  precio: string;
  mensajeHuesped: string;
  bookingUrl: string;
}

export interface VisitorInquiry {
  uid: number;
  para: string;
  fechaConsulta: Date;
  nombre: string;
  email: string;
  telefono: string;
  fechaIngreso: Date | null;
  fechaSalida: Date | null;
  adultos: number;
  menores: number;
  consulta: string;
}

export function toWhatsAppUrl(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("549")) return `https://wa.me/${clean}`;
  if (clean.startsWith("54")) return `https://wa.me/${clean}`;
  return `https://wa.me/549${clean}`;
}
