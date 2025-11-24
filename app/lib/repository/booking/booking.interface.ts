import { BookingDatesDTO, ChannelDTO, CreateBookingDTO } from "./booking.dto";

export interface IBookingRepository {
  createBooking(bookingData: CreateBookingDTO): Promise<void>;
  //   cancelBooking(): Promise<void>;
  getChannels(): Promise<ChannelDTO[]>;
  getBookingsDate(): Promise<BookingDatesDTO[]>;
}
