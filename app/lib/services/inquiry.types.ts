// Client-safe types and helpers — NO Node.js imports here

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
