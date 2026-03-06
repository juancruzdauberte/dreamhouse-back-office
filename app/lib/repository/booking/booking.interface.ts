import {
  BookingDatesDTO,
  BookingDTO,
  ChannelDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
  RevenueByMonthDTO,
  BookingsByMonthDTO,
  BookingsByChannelDTO,
} from "./booking.dto";

export interface IBookingRepository {
  createBooking(bookingData: CreateBookingDTO): Promise<number>;
  updateBooking(bookingData: UpdateBookingDTO): Promise<void>;
  getBooking(id: number): Promise<BookingDTO | null>;
  getBookingsForCalendar(
    startDate: string,
    endDate: string,
    limit?: number,
  ): Promise<BookingDTO[]>;
  getChannels(): Promise<ChannelDTO[]>;
  getBookingsDate(): Promise<BookingDatesDTO[]>;
  getBookingStats(): Promise<{
    totalRevenueArs: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalNights: number;
  }>;
  deleteBooking(id: number): Promise<void>;
  getClosestUpcomingBooking(): Promise<BookingDTO | null>;
  getRevenueByMonthUSD(): Promise<RevenueByMonthDTO[]>;
  getBookingsByMonth(): Promise<BookingsByMonthDTO[]>;
  getBookingsByChannel(): Promise<BookingsByChannelDTO[]>;
}
