import { create } from 'zustand';

export interface Reading {
  value: number;
  time: number;
  room: string;
}

interface LiveState {
  readings: Reading[];
  addReading: (reading: Reading) => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  readings: [],
  addReading: (reading) => 
    set((state) => {
      const newReadings = [...state.readings, reading];
      if (newReadings.length > 30) {
        return { readings: newReadings.slice(newReadings.length - 30) };
      }
      return { readings: newReadings };
    }),
}));