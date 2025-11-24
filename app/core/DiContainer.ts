import { BookingRepository } from "../lib/repository/booking/booking.repository";

export class DIContainer {
  private static bookingRepository: BookingRepository;

  public static getBookingRepository(): BookingRepository {
    if (!this.bookingRepository) {
      this.bookingRepository = new BookingRepository();
    }
    return this.bookingRepository;
  }
}
