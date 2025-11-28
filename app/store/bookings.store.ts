import { create } from "zustand";

interface BookingStore {
  channels: Array<{ id: number; channel_name: string }>;
  datesUnavailable: Array<{ check_in: string; check_out: string }>;
  selectedChannel: number;
  selectedBookingId: number | null;
  setChannels: (channels: Array<{ id: number; channel_name: string }>) => void;
  setSelectedChannel: (channel: number) => void;
  setDatesUnavailable: (
    datesUnavailable: Array<{ check_in: string; check_out: string }>
  ) => void;
  setSelectedBookingId: (id: number | null) => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  channels: [],
  datesUnavailable: [],
  selectedChannel: 0,
  selectedBookingId: null,
  setChannels: (channels) => set({ channels }),
  setDatesUnavailable: (datesUnavailable) => set({ datesUnavailable }),
  setSelectedChannel: (selectedChannel) => set({ selectedChannel }),
  setSelectedBookingId: (selectedBookingId) => set({ selectedBookingId }),
}));
