import { RowDataPacket } from "mysql2";
import { pool } from "../../db/db";
import { BookingDatesDTO, ChannelDTO, CreateBookingDTO } from "./booking.dto";
import { IBookingRepository } from "./booking.interface";

export class BookingRepository implements IBookingRepository {
  async createBooking(bookingData: CreateBookingDTO): Promise<void> {
    try {
      const fechaActual = new Date();
      const [rows] = await pool.execute<RowDataPacket[]>(
        "INSERT INTO fact_reservas (fecha_reserva_fk, fecha_checkin_fk, fecha_checkout_fk, id_canal_fk, cant_huespedes, estado_reserva, reserva_por_adv, nombre_huesped_ref, precio_total_cotizado_usd, comision_canal_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          fechaActual,
          bookingData.check_in,
          bookingData.check_out,
          bookingData.channel_id,
          bookingData.tenant_cuantity,
          "Confirmada",
          bookingData.booking_adv,
          bookingData.tenant_name,
          bookingData.booking_total_price_usd,
          bookingData.comission,
        ]
      );
      if (rows.length === 0) console.log("Error al crear la reserva");
    } catch (error) {
      console.log(error);
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
