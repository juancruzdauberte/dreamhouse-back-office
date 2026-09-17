export interface PropertyDTO {
  id: number;
  name: string;
  description?: string | null;
  max_guests: number;
  status: "activa" | "inactiva";
}

export interface CreatePropertyDTO {
  name: string;
  description?: string | null;
  max_guests: number;
}

export interface UpdatePropertyDTO {
  id: number;
  name?: string;
  description?: string | null;
  max_guests?: number;
  status?: "activa" | "inactiva";
}
