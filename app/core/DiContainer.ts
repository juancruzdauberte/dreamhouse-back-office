import { BookingRepository } from "../lib/repository/booking/booking.repository";
import { PropertyRepository } from "../lib/repository/property/property.repository";

export class DIContainer {
  private static bookingRepository: BookingRepository;
  private static propertyRepository: PropertyRepository;

  public static getBookingRepository(): BookingRepository {
    if (!this.bookingRepository) {
      this.bookingRepository = new BookingRepository();
    }
    return this.bookingRepository;
  }

  public static getPropertyRepository(): PropertyRepository {
    if (!this.propertyRepository) {
      this.propertyRepository = new PropertyRepository();
    }
    return this.propertyRepository;
  }
}
