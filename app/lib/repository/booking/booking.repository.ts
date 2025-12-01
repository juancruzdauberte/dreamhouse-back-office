import { RowDataPacket } from "mysql2";
import { pool } from "../../db/db";
import {
  BookingDatesDTO,
  BookingDTO,
  ChannelDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
} from "./booking.dto";
import { IBookingRepository } from "./booking.interface";

export class BookingRepository implements IBookingRepository {
  async createBooking(bookingData: CreateBookingDTO): Promise<void> {
    try {
      const fechaActual = new Date();

      await pool.execute(
        "INSERT INTO fact_reservas (fecha_reserva_fk, fecha_checkin_fk, fecha_checkout_fk, id_canal_fk, cant_huespedes, estado_reserva, reserva_por_adv, nombre_huesped_ref, precio_total_cotizado_usd, comision_canal_usd, pago_anticipo_ars, precio_total_cotizado_ars, monto_anticipo_usd, tel_huesped) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
          bookingData.booking_total_price_ars,
          bookingData.prepayment_usd,
          bookingData.guest_phone,
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

  async getBooking(id: number): Promise<BookingDTO | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          fr.id_reserva as id,
          fr.fecha_reserva_fk as booking_date,
          fr.fecha_checkin_fk as check_in,
          fr.fecha_checkout_fk as check_out,
          dm.nombre_canal as channel_name,
          fr.cant_huespedes as guest_count,
          fr.noches_estadia as nights_stay,
          fr.estado_reserva as status,
          fr.nombre_huesped_ref as guest_name,
          fr.precio_noche_cotizado_usd as price_per_night_usd,
          fr.precio_total_cotizado_usd as total_price_usd,
          fr.monto_anticipo_usd as deposit_amount_usd,
          fr.monto_saldo_usd as balance_amount_usd,
          fr.pago_anticipo_ars as deposit_payment_ars,
          fr.tipo_cambio_anticipo as deposit_exchange_rate,
          fr.pago_saldo_ars as balance_payment_ars,
          fr.tipo_cambio_saldo as balance_exchange_rate,
          fr.comision_canal_usd as channel_commission_usd,
          fr.reserva_por_adv as advertising_booking,
          fr.precio_total_cotizado_ars as total_price_ars,
          fr.tel_huesped as guest_phone
        FROM fact_reservas fr 
        INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk 
        WHERE fr.id_reserva = ?`,
        [id]
      );

      if (rows.length === 0) {
        console.log(`No se encontró la reserva con id ${id}`);
        return null;
      }

      return rows[0] as BookingDTO;
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

  async getAllBookings(
    page: number = 1,
    limit: number = 10
  ): Promise<{ bookings: BookingDTO[]; total: number }> {
    try {
      const offset = (page - 1) * limit;

      // Get total count
      const [countRows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) as total FROM fact_reservas"
      );
      const total = countRows[0].total;

      // Get paginated bookings
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          fr.id_reserva as id,
          fr.fecha_reserva_fk as booking_date,
          fr.fecha_checkin_fk as check_in,
          fr.fecha_checkout_fk as check_out,
          dm.nombre_canal as channel_name,
          fr.cant_huespedes as guest_count,
          fr.noches_estadia as nights_stay,
          fr.estado_reserva as status,
          fr.nombre_huesped_ref as guest_name,
          fr.precio_noche_cotizado_usd as price_per_night_usd,
          fr.precio_total_cotizado_usd as total_price_usd,
          fr.monto_anticipo_usd as deposit_amount_usd,
          fr.monto_saldo_usd as balance_amount_usd,
          fr.pago_anticipo_ars as deposit_payment_ars,
          fr.tipo_cambio_anticipo as deposit_exchange_rate,
          fr.pago_saldo_ars as balance_payment_ars,
          fr.tipo_cambio_saldo as balance_exchange_rate,
          fr.comision_canal_usd as channel_commission_usd,
          fr.reserva_por_adv as advertising_booking,
          fr.precio_total_cotizado_ars as total_price_ars,
          fr.tel_huesped as guest_phone
        FROM fact_reservas fr 
        INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
        ORDER BY fr.fecha_checkin_fk DESC
        LIMIT ? OFFSET ?`,
        [limit.toString(), offset.toString()]
      );

      return { bookings: rows as BookingDTO[], total };
    } catch (error) {
      console.error("=== ERROR IN REPOSITORY ===");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error"
      );
      console.error("=== END ERROR ===");
      return { bookings: [], total: 0 };
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

  async getBookingStats(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalNights: number;
  }> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total_bookings,
          SUM(CASE WHEN estado_reserva = 'Confirmada' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(precio_total_cotizado_usd) as total_revenue,
          SUM(noches_estadia) as total_nights
        FROM fact_reservas`
      );

      const stats = rows[0];
      return {
        totalBookings: stats.total_bookings || 0,
        confirmedBookings: Number(stats.confirmed_bookings) || 0,
        totalRevenue: Number(stats.total_revenue) || 0,
        totalNights: Number(stats.total_nights) || 0,
      };
    } catch (error) {
      console.error("Error getting booking stats:", error);
      return {
        totalBookings: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        totalNights: 0,
      };
    }
  }

  async updateBooking(bookingData: UpdateBookingDTO): Promise<void> {
    try {
      await pool.execute(
        "UPDATE fact_reservas SET fecha_checkin_fk = ?, fecha_checkout_fk = ?, id_canal_fk = ?, cant_huespedes = ?, estado_reserva = ?, reserva_por_adv = ?, nombre_huesped_ref = ?, precio_total_cotizado_usd = ?, precio_total_cotizado_ars = ?, comision_canal_usd = ?, pago_anticipo_ars = ?, monto_anticipo_usd = ?, pago_saldo_ars = ?, monto_saldo_usd = ?, tel_huesped = ? WHERE id_reserva = ?",
        [
          bookingData.check_in,
          bookingData.check_out,
          bookingData.channel_id,
          bookingData.tenant_quantity,
          bookingData.booking_state,
          bookingData.booking_adv,
          bookingData.tenant_name,
          bookingData.booking_total_price_usd,
          bookingData.booking_total_price_ars,
          bookingData.comission,
          bookingData.prepayment_ars,
          bookingData.prepayment_usd,
          bookingData.balancepayment_ars,
          bookingData.balancepayment_usd,
          bookingData.guest_phone,
          bookingData.id,
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

  async deleteBooking(id: number): Promise<void> {
    try {
      await pool.execute("DELETE FROM fact_reservas WHERE id_reserva = ?", [
        id,
      ]);
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
}
