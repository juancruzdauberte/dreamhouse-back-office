import {
  BookingDatesDTO,
  BookingDTO,
  ChannelDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
} from "./booking.dto";

export interface IBookingRepository {
  createBooking(bookingData: CreateBookingDTO): Promise<number>;
  updateBooking(bookingData: UpdateBookingDTO): Promise<void>;
  getBooking(id: number): Promise<BookingDTO | null>;
  getAllBookings(
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{ bookings: BookingDTO[]; total: number }>;
  getChannels(): Promise<ChannelDTO[]>;
  getBookingsDate(): Promise<BookingDatesDTO[]>;
  getBookingStats(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    totalRevenue: number;
    totalNights: number;
  }>;
  deleteBooking(id: number): Promise<void>;
  getClosestUpcomingBooking(): Promise<BookingDTO | null>;
}
