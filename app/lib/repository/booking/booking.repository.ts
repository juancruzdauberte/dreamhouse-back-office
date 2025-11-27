import { RowDataPacket } from "mysql2";
import { pool } from "../../db/db";
import { BookingDatesDTO, ChannelDTO, CreateBookingDTO } from "./booking.dto";
import { IBookingRepository } from "./booking.interface";

export class BookingRepository implements IBookingRepository {
  async createBooking(bookingData: CreateBookingDTO): Promise<void> {
    try {
      const fechaActual = new Date();

      await pool.execute(
        "INSERT INTO fact_reservas (fecha_reserva_fk, fecha_checkin_fk, fecha_checkout_fk, id_canal_fk, cant_huespedes, estado_reserva, reserva_por_adv, nombre_huesped_ref, precio_total_cotizado_usd, comision_canal_usd, pago_anticipo_ars) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          fechaActual,
          bookingData.check_in,
          bookingData.check_out,
          bookingData.channel_id,
          bookingData.tenant_quantity,
          "Confirmada",
          bookingData.booking_adv,
          bookingData.tenant_name,
          bookingData.booking_total_price_usd,
          bookingData.comission,
          bookingData.prepayment_ars,
        ]
      );
    } catch (error) {
      console.error("=== ERROR IN REPOSITORY ===");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error("=== END ERROR ===");
      throw error;
    }
  }

  async getChannels(): Promise<ChannelDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id_canal as id, nombre_canal as channel_name FROM dim_canales"
      );
      if (rows.length === 0) console.log("No se encontraron canales");

      return rows as ChannelDTO[];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getBookingsDate(): Promise<BookingDatesDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT fecha_checkin_fk as check_in, fecha_checkout_fk as check_out FROM fact_reservas"
      );
      if (rows.length === 0) console.log("No se encontraron reservas");

      return rows as BookingDatesDTO[];
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}
