import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../db/db";
import {
  BookingDatesDTO,
  BookingDTO,
  BookingSearchDTO,
  ChannelDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
  RevenueByMonthDTO,
  BookingsByMonthDTO,
  BookingsByChannelDTO,
  PropertyStatsDTO,
} from "./booking.dto";
import { IBookingRepository } from "./booking.interface";

export class BookingRepository implements IBookingRepository {
  async createBooking(bookingData: CreateBookingDTO): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO fact_reservas (fecha_reserva_fk, fecha_checkin_fk, fecha_checkout_fk, id_propiedad_fk, id_canal_fk, cant_huespedes, estado_reserva, reserva_por_adv, nombre_huesped_ref, precio_total_cotizado_usd, precio_total_cotizado_ars, tel_huesped, medio_dia, observaciones, monto_anticipo_usd, monto_anticipo_ars, tipo_cambio_anticipo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          new Date(),
          bookingData.check_in,
          bookingData.check_out,
          bookingData.property_id,
          bookingData.channel_id,
          bookingData.tenant_quantity,
          "Confirmada",
          bookingData.booking_adv,
          bookingData.tenant_name,
          bookingData.booking_total_price_usd,
          bookingData.booking_total_price_ars,
          bookingData.guest_phone,
          bookingData.noon,
          bookingData.observations ?? null,
          bookingData.deposit_amount_usd,
          bookingData.deposit_amount_ars,
          bookingData.deposit_exchange_rate,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error("=== ERROR IN REPOSITORY ===");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
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
          dp.id_propiedad as property_id,
          dp.nombre as property_name,
          fr.cant_huespedes as guest_count,
          fr.noches_estadia as nights_stay,
          fr.estado_reserva as status,
          fr.nombre_huesped_ref as guest_name,
          fr.precio_noche_cotizado_usd as price_per_night_usd,
          fr.precio_total_cotizado_usd as total_price_usd,
          fr.monto_anticipo_usd as deposit_amount_usd,
          fr.monto_saldo_usd as balance_amount_usd,
          fr.monto_anticipo_ars as deposit_amount_ars,
          fr.tipo_cambio_anticipo as deposit_exchange_rate,
          fr.monto_saldo_ars as balance_amount_ars,
          fr.tipo_cambio_saldo as balance_exchange_rate,
          fr.comision_canal_usd as channel_commission_usd,
          fr.reserva_por_adv as advertising_booking,
          fr.precio_total_cotizado_ars as total_price_ars,
          fr.tel_huesped as guest_phone,
          fr.medio_dia as noon,
          fr.observaciones as observations,
          fr.google_event_id as google_event_id
        FROM fact_reservas fr
        INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
        LEFT JOIN dim_propiedades dp ON dp.id_propiedad = fr.id_propiedad_fk
        WHERE fr.id_reserva = ?`,
        [id],
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
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error("=== END ERROR ===");
      throw error;
    }
  }

  async getBookingsForCalendar(
    startDate: string,
    endDate: string,
    limit: number = 200,
  ): Promise<BookingDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          fr.id_reserva as id,
          fr.fecha_checkin_fk as check_in,
          fr.fecha_checkout_fk as check_out,
          dp.nombre as property_name,
          fr.cant_huespedes as guest_count,
          fr.noches_estadia as nights_stay,
          fr.estado_reserva as status,
          fr.nombre_huesped_ref as guest_name,
          fr.precio_total_cotizado_usd as total_price_usd,
          fr.precio_total_cotizado_ars as total_price_ars
        FROM fact_reservas fr
        LEFT JOIN dim_propiedades dp ON dp.id_propiedad = fr.id_propiedad_fk
        WHERE fr.fecha_checkin_fk BETWEEN ? AND ?
        ORDER BY fr.fecha_checkin_fk DESC
        LIMIT ?`,
        [startDate, endDate, limit.toString()],
      );

      return rows as BookingDTO[];
    } catch (error) {
      console.error("Error getting bookings for calendar:", error);
      return [];
    }
  }
  async getChannels(): Promise<ChannelDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT id_canal as id, nombre_canal as channel_name FROM dim_canales",
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
        "SELECT fecha_checkin_fk as check_in, fecha_checkout_fk as check_out FROM fact_reservas WHERE estado_reserva != 'Cancelada' AND estado_reserva != 'Pendiente'",
      );
      if (rows.length === 0) console.log("No se encontraron reservas");

      return rows as BookingDatesDTO[];
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getBookingStats(): Promise<{
    totalRevenueArs: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalNights: number;
    avgPerPersonPerNight: number;
    avgPerNight: number;
  }> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          SUM(precio_total_cotizado_ars) as total_revenue_ars,
          SUM(CASE WHEN estado_reserva = 'Confirmada' THEN 1 ELSE 0 END) as confirmed_bookings,
          SUM(precio_total_cotizado_usd) as total_revenue,
          SUM(noches_estadia) as total_nights,
          SUM(precio_total_cotizado_usd) / NULLIF(SUM(noches_estadia * cant_huespedes), 0) as avg_per_person_per_night,
          SUM(precio_total_cotizado_usd) / NULLIF(SUM(noches_estadia), 0) as avg_per_night
        FROM fact_reservas`,
      );

      const stats = rows[0];
      return {
        totalRevenueArs: Number(stats.total_revenue_ars) || 0,
        confirmedBookings: Number(stats.confirmed_bookings) || 0,
        totalRevenue: Number(stats.total_revenue) || 0,
        totalNights: Number(stats.total_nights) || 0,
        avgPerPersonPerNight: Number(stats.avg_per_person_per_night) || 0,
        avgPerNight: Number(stats.avg_per_night) || 0,
      };
    } catch (error) {
      console.error("Error getting booking stats:", error);
      return {
        totalRevenueArs: 0,
        confirmedBookings: 0,
        totalRevenue: 0,
        totalNights: 0,
        avgPerPersonPerNight: 0,
        avgPerNight: 0,
      };
    }
  }

  async updateBooking(bookingData: UpdateBookingDTO): Promise<void> {
    try {
      await pool.execute(
        `UPDATE fact_reservas SET fecha_checkin_fk = ?, fecha_checkout_fk = ?, id_propiedad_fk = ?, id_canal_fk = ?, cant_huespedes = ?, estado_reserva = ?, reserva_por_adv = ?, nombre_huesped_ref = ?, precio_total_cotizado_usd = ?, precio_total_cotizado_ars = ?, tel_huesped = ?, medio_dia = ?, observaciones = ?, monto_anticipo_usd = ?, monto_anticipo_ars = ?, tipo_cambio_anticipo = ?, tipo_cambio_saldo = ? WHERE id_reserva = ?`,
        [
          (bookingData.check_in,
          bookingData.check_out,
          bookingData.property_id,
          bookingData.channel_id,
          bookingData.tenant_quantity,
          bookingData.booking_state,
          bookingData.booking_adv,
          bookingData.tenant_name,
          bookingData.booking_total_price_usd,
          bookingData.booking_total_price_ars,
          bookingData.guest_phone,
          bookingData.noon,
          bookingData.observations ?? null,
          bookingData.deposit_amount_usd ?? null,
          bookingData.deposit_amount_ars ?? null,
          bookingData.deposit_exchange_rate ?? null,
          bookingData.balance_exchange_rate ?? null,
          bookingData.balance_exchange_rate ?? null,
          bookingData.id),
        ],
      );
    } catch (error) {
      console.error("=== ERROR IN REPOSITORY ===");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
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
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error("=== END ERROR ===");
      throw error;
    }
  }

  async getAllBookings(): Promise<BookingDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          fr.id_reserva as id,
          fr.fecha_reserva_fk as booking_date,
          fr.fecha_checkin_fk as check_in,
          fr.fecha_checkout_fk as check_out,
          dm.nombre_canal as channel_name,
          dp.id_propiedad as property_id,
          dp.nombre as property_name,
          fr.cant_huespedes as guest_count,
          fr.noches_estadia as nights_stay,
          fr.estado_reserva as status,
          fr.nombre_huesped_ref as guest_name,
          fr.precio_noche_cotizado_usd as price_per_night_usd,
          fr.precio_total_cotizado_usd as total_price_usd,
          fr.monto_anticipo_usd as deposit_amount_usd,
          fr.monto_saldo_usd as balance_amount_usd,
          fr.monto_anticipo_ars as deposit_amount_ars,
          fr.tipo_cambio_anticipo as tipo_cambio_anticipo,
          fr.tipo_cambio_anticipo as deposit_exchange_rate,
          fr.monto_saldo_ars as balance_amount_ars,
          fr.tipo_cambio_saldo as tipo_cambio_saldo,
          fr.tipo_cambio_saldo as balance_exchange_rate,
          fr.comision_canal_usd as channel_commission_usd,
          fr.reserva_por_adv as advertising_booking,
          fr.precio_total_cotizado_ars as total_price_ars,
          fr.tel_huesped as guest_phone,
          fr.medio_dia as noon
        FROM fact_reservas fr
        INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
        LEFT JOIN dim_propiedades dp ON dp.id_propiedad = fr.id_propiedad_fk
        ORDER BY fr.fecha_checkin_fk DESC`,
      );
      return rows as BookingDTO[];
    } catch (error) {
      console.error("Error getting all bookings:", error);
      return [];
    }
  }

  async getAllBookingsForSearch(): Promise<BookingSearchDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          fr.id_reserva          as id,
          fr.nombre_huesped_ref  as guest_name,
          dm.nombre_canal        as channel_name,
          dp.nombre              as property_name,
          fr.fecha_checkin_fk    as check_in,
          fr.fecha_checkout_fk   as check_out,
          fr.estado_reserva      as status
        FROM fact_reservas fr
        INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
        LEFT JOIN dim_propiedades dp ON dp.id_propiedad = fr.id_propiedad_fk
        ORDER BY fr.fecha_checkin_fk DESC`,
      );
      return rows as BookingSearchDTO[];
    } catch (error) {
      console.error("Error getting bookings for search:", error);
      return [];
    }
  }

  async getRevenueByMonthUSD(): Promise<RevenueByMonthDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(fecha_checkin_fk, '%Y-%m') as month,
          SUM(precio_total_cotizado_usd) as revenue
         FROM fact_reservas
         WHERE estado_reserva != 'Cancelada'
         GROUP BY DATE_FORMAT(fecha_checkin_fk, '%Y-%m')
         ORDER BY month ASC
         LIMIT 12`,
      );

      return rows as RevenueByMonthDTO[];
    } catch (error) {
      console.error("Error getting revenue by month:", error);
      return [];
    }
  }

  async getBookingsByMonth(): Promise<BookingsByMonthDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(fecha_checkin_fk, '%Y-%m') as month,
          COUNT(*) as bookings
         FROM fact_reservas
         WHERE estado_reserva != 'Cancelada'
         GROUP BY DATE_FORMAT(fecha_checkin_fk, '%Y-%m')
         ORDER BY month ASC
         LIMIT 12`,
      );

      return rows as BookingsByMonthDTO[];
    } catch (error) {
      console.error("Error getting bookings by month:", error);
      return [];
    }
  }

  async getBookingsByChannel(): Promise<BookingsByChannelDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          dm.nombre_canal as channel_name,
          COUNT(fr.id_reserva) as bookings
         FROM fact_reservas fr
         INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
         WHERE fr.estado_reserva != 'Cancelada'
         GROUP BY dm.nombre_canal
         ORDER BY bookings DESC`,
      );

      return rows as BookingsByChannelDTO[];
    } catch (error) {
      console.error("Error getting bookings by channel:", error);
      return [];
    }
  }

  async updateGoogleEventId(bookingId: number, eventId: string): Promise<void> {
    try {
      await pool.execute(
        "UPDATE fact_reservas SET google_event_id = ? WHERE id_reserva = ?",
        [eventId, bookingId],
      );
    } catch (error) {
      console.error("Error updating google_event_id:", error);
      throw error;
    }
  }

  // PHASE 1 NEW METHOD: Paginated search for bookings
  async searchBookings(
    q: string,
    offset: number,
    limit: number,
  ): Promise<BookingSearchDTO[]> {
    try {
      const query = `%${q}%`;
      const sql = `SELECT
              fr.id_reserva as id,
              fr.nombre_huesped_ref as guest_name,
              dm.nombre_canal as channel_name,
              dp.nombre as property_name,
              fr.fecha_checkin_fk as check_in,
              fr.fecha_checkout_fk as check_out,
              fr.estado_reserva as status
            FROM fact_reservas fr
            INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
            LEFT JOIN dim_propiedades dp ON dp.id_propiedad = fr.id_propiedad_fk
            WHERE fr.nombre_huesped_ref LIKE ?
              OR dm.nombre_canal LIKE ?
              OR fr.tel_huesped LIKE ?
            ORDER BY fr.fecha_checkin_fk DESC
            LIMIT ? OFFSET ?`;
      const params = [query, query, query, limit, offset];
      const [rows] = await pool.execute(sql, params);
      return rows as RowDataPacket[] as BookingSearchDTO[];
    } catch (error) {
      console.error("Error searching bookings:", error);
      return [];
    }
  }

  // PHASE 1 NEW METHOD: Count bookings for pagination
  async countBookings(q: string): Promise<number> {
    try {
      const query = `%${q}%`;
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM fact_reservas fr
            INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
            WHERE fr.nombre_huesped_ref LIKE ?
              OR dm.nombre_canal LIKE ?
              OR fr.tel_huesped LIKE ?`,
        [query, query, query],
      );
      return (rows[0] as any).total || 0;
    } catch (error) {
      console.error("Error counting bookings:", error);
      return 0;
    }
  }

  async getBookingStatsByProperty(
    propertyId: number,
  ): Promise<PropertyStatsDTO | null> {
    try {
      const sql = `SELECT
             fr.id_propiedad_fk as property_id,
             dp.nombre as property_name,
             COALESCE(SUM(fr.precio_total_cotizado_usd), 0) as total_revenue_usd,
             COALESCE(SUM(fr.precio_total_cotizado_ars), 0) as total_revenue_ars,
             COALESCE(SUM(COALESCE(fr.monto_anticipo_ars / NULLIF(fr.tipo_cambio_anticipo, 0),0) +
                 COALESCE(fr.monto_saldo_ars / NULLIF(fr.tipo_cambio_saldo, 0), 0)), 0) as converted_ars_to_usd,
             COALESCE(SUM(CASE WHEN fr.estado_reserva = 'Confirmada' THEN 1 ELSE 0 END), 0) as confirmed_bookings,
             COALESCE(SUM(fr.noches_estadia), 0) as total_nights,
             COALESCE(SUM(fr.noches_estadia * fr.cant_huespedes), 0) as total_guest_nights
           FROM fact_reservas fr
           LEFT JOIN dim_propiedades dp ON dp.id_propiedad = fr.id_propiedad_fk
           WHERE fr.id_propiedad_fk = ?
           AND fr.estado_reserva != 'Cancelada'
           GROUP BY fr.id_propiedad_fk, dp.nombre`;

      const [rows] = await pool.execute(sql, [propertyId]);

      if (rows.length === 0) return null;

      const row = (rows as RowDataPacket[])[0];

      const totalRevenueUsd = Number(row.total_revenue_usd) || 0;
      const totalRevenueArs = Number(row.total_revenue_ars) || 0;
      const totalNights = Number(row.total_nights) || 0;
      const totalGuestNights = Number(row.total_guest_nights) || 0;

      return {
        property_id: Number(row.property_id),
        property_name: row.property_name,
        total_revenue_usd: totalRevenueUsd,
        total_revenue_ars: totalRevenueArs,
        converted_ars_to_usd: Number(row.converted_ars_to_usd) || 0,
        confirmed_bookings: Number(row.confirmed_bookings) || 0,
        total_nights: totalNights,
        total_guests_nights: totalGuestNights,
        avg_price_per_night_usd:
          totalNights > 0 ? totalRevenueUsd / totalNights : 0,
        avg_price_per_night_ars:
          totalNights > 0 ? totalRevenueArs / totalNights : 0,
        avg_per_person_per_night_usd:
          totalGuestNights > 0 ? totalRevenueUsd / totalGuestNights : 0,
        avg_per_person_per_night_ars:
          totalGuestNights > 0 ? totalRevenueArs / totalGuestNights : 0,
      };
    } catch (error) {
      console.error("Error getting booking stats by property:", error);
      return null;
    }
  }

  async getRevenueByMonthByProperty(propertyId: number): Promise<
    {
      month: string;
      revenue_usd: number;
      revenue_ars: number;
      converted_ars_to_usd: number;
    }[]
  > {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(fr.fecha_checkin_fk, '%Y-%m') as month,
          SUM(fr.precio_total_cotizado_usd) as revenue_usd,
          SUM(fr.precio_total_cotizado_ars) as revenue_ars,
          SUM(COALESCE(fr.monto_anticipo_ars / NULLIF(fr.tipo_cambio_anticipo, 0), 0) +
              COALESCE(fr.monto_saldo_ars / NULLIF(fr.tipo_cambio_saldo, 0), 0)) as converted_ars_to_usd
        FROM fact_reservas fr
        WHERE fr.id_propiedad_fk = ?
        AND fr.estado_reserva != 'Cancelada'
        GROUP BY DATE_FORMAT(fr.fecha_checkin_fk, '%Y-%m')
        ORDER BY month ASC
        LIMIT 12`,
        [propertyId],
      );

      return rows.map((row) => ({
        month: row.month,
        revenue_usd: Number(row.revenue_usd) || 0,
        revenue_ars: Number(row.revenue_ars) || 0,
        converted_ars_to_usd: Number(row.converted_ars_to_usd) || 0,
      }));
    } catch (error) {
      console.error("Error getting revenue by month by property:", error);
      return [];
    }
  }

  async getBookingsByMonthByProperty(
    propertyId: number,
  ): Promise<{ month: string; bookings: number }[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          DATE_FORMAT(fr.fecha_checkin_fk, '%Y-%m') as month,
          COUNT(*) as bookings
        FROM fact_reservas fr
        WHERE fr.id_propiedad_fk = ?
        AND fr.estado_reserva != 'Cancelada'
        GROUP BY DATE_FORMAT(fr.fecha_checkin_fk, '%Y-%m')
        ORDER BY month ASC
        LIMIT 12`,
        [propertyId],
      );

      return rows as { month: string; bookings: number }[];
    } catch (error) {
      console.error("Error getting bookings by month by property:", error);
      return [];
    }
  }

  async getBookingsByChannelByProperty(propertyId: number): Promise<
    {
      channel_name: string;
      bookings: number;
      revenue_usd: number;
      revenue_ars: number;
      converted_ars_to_usd: number;
    }[]
  > {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          dm.nombre_canal as channel_name,
          COUNT(fr.id_reserva) as bookings,
          SUM(fr.precio_total_cotizado_usd) as revenue_usd,
          SUM(fr.precio_total_cotizado_ars) as revenue_ars,
          SUM(COALESCE(fr.monto_anticipo_ars / NULLIF(fr.tipo_cambio_anticipo, 0), 0) +
              COALESCE(fr.monto_saldo_ars / NULLIF(fr.tipo_cambio_saldo, 0), 0)) as converted_ars_to_usd
        FROM fact_reservas fr
        INNER JOIN dim_canales dm ON dm.id_canal = fr.id_canal_fk
        WHERE fr.id_propiedad_fk = ?
        AND fr.estado_reserva != 'Cancelada'
        GROUP BY dm.nombre_canal, fr.id_canal_fk
        ORDER BY bookings DESC`,
        [propertyId],
      );

      return rows.map((row) => ({
        channel_name: row.channel_name,
        bookings: Number(row.bookings) || 0,
        revenue_usd: Number(row.revenue_usd) || 0,
        revenue_ars: Number(row.revenue_ars) || 0,
        converted_ars_to_usd: Number(row.converted_ars_to_usd) || 0,
      }));
    } catch (error) {
      console.error("Error getting bookings by channel by property:", error);
      return [];
    }
  }
}
