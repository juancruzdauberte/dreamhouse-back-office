"use server";

import { DIContainer } from "../../core/DiContainer";

export async function fetchPropertyStats(propertyId: number) {
  const bookingRepo = DIContainer.getBookingRepository();
  return bookingRepo.getBookingStatsByProperty(propertyId);
}

export async function fetchPropertyRevenueByMonth(propertyId: number) {
  const bookingRepo = DIContainer.getBookingRepository();
  return bookingRepo.getRevenueByMonthByProperty(propertyId);
}

export async function fetchPropertyBookingsByMonth(propertyId: number) {
  const bookingRepo = DIContainer.getBookingRepository();
  return bookingRepo.getBookingsByMonthByProperty(propertyId);
}

export async function fetchPropertyBookingsByChannel(propertyId: number) {
  const bookingRepo = DIContainer.getBookingRepository();
  return bookingRepo.getBookingsByChannelByProperty(propertyId);
}
