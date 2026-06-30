import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Alert {
  id: string;
  db: number;
  room: string;
  time: string;
  severity: Severity;
  description: string;
}

export interface Sensor {
  id: string;
  name: string;
  room: string;
  status: 'Active' | 'Offline';
  roomType: 'Noisy' | 'Silent';
}

// 1. Define the Reading interface for the real-time chart
export interface Reading {
  value: number;
  time: number;
  room: string;
}

interface AppState {
  alerts: Alert[];
  sensors: Sensor[];
  readings: Reading[]; // Array for the live chart
  addAlert: (alert: Alert) => void;
  updateSensorStatus: (id: string, status: 'Active' | 'Offline') => void;
  addReading: (reading: Reading) => void; // Function to add incoming 500ms data
}

const MOCK_ALERTS: Alert[] = [
  { id: '1',  db: 92, room: 'Kitchen', time: '21:00', severity: 'HIGH', description: "haha" },
  { id: '2', db: 78, room: 'Front door', time: '20:32', severity: 'MEDIUM', description: "haha" },
  { id: '3', db: 70, room: "Maria's room", time: '19:32', severity: 'MEDIUM', description: "haha" },
];

const MOCK_SENSORS: Sensor[] = [
  { id: 's1', name: 'Sensor 1', room: 'Kitchen', status: 'Active', roomType: 'Noisy' },
  { id: 's2', name: 'Sensor 2', room: 'Living room', status: 'Active', roomType: 'Silent' },
  { id: 's4', name: 'Sensor 4', room: 'Front door', status: 'Offline', roomType: 'Noisy' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      alerts: MOCK_ALERTS,
      sensors: MOCK_SENSORS,
      readings: [], // Initialize the readings array

      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
      
      updateSensorStatus: (id, status) => set((state) => ({
        sensors: state.sensors.map(s => s.id === id ? { ...s, status } : s)
      })),

      // 2. Implement addReading with a buffer limit to maintain performance
      addReading: (reading) => 
        set((state) => {
          const newReadings = [...state.readings, reading];
          
          // Keep only the last 30 readings (15 seconds of data at 500ms intervals)
          if (newReadings.length > 30) {
            return { readings: newReadings.slice(newReadings.length - 30) };
          }
          
          return { readings: newReadings };
        }),
    }),
    {
      name: 'sound-monitor-storage',
      storage: createJSONStorage(() => AsyncStorage),
      
      // 3. Prevent the 500ms stream from constantly writing to disk
      partialize: (state) => ({
        alerts: state.alerts,
        sensors: state.sensors,
        // Notice that 'readings' is explicitly excluded here
      }),
    }
  )
);