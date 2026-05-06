import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Alert {
  id: string;
  hz: number;
  db: number;
  room: string;
  time: string;
  severity: Severity;
}

export interface Sensor {
  id: string;
  name: string;
  room: string;
  status: 'Active' | 'Offline';
  roomType: 'Noisy' | 'Silent';
}

interface AppState {
  alerts: Alert[];
  sensors: Sensor[];
  addAlert: (alert: Alert) => void;
  updateSensorStatus: (id: string, status: 'Active' | 'Offline') => void;
}

const MOCK_ALERTS: Alert[] = [
  { id: '1', hz: 3200, db: 92, room: 'Kitchen', time: '21:00', severity: 'HIGH' },
  { id: '2', hz: 1800, db: 78, room: 'Front door', time: '20:32', severity: 'MEDIUM' },
  { id: '3', hz: 500, db: 70, room: "Maria's room", time: '19:32', severity: 'MEDIUM' },
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
      addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
      updateSensorStatus: (id, status) => set((state) => ({
        sensors: state.sensors.map(s => s.id === id ? { ...s, status } : s)
      })),
    }),
    {
      name: 'sound-monitor-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);