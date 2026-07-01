import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useLiveStore } from '../store/useLiveStore'; // Import the new store

const FASTAPI_WS_URL = 'ws://192.168.0.169:5000/ws/alerts';

export const useRadxaConnection = () => {
  const ws = useRef<WebSocket | null>(null);
  const addAlert = useAppStore((state) => state.addAlert);
  const updateSensorStatus = useAppStore((state) => state.updateSensorStatus);

  useEffect(() => {
    let reconnectInterval: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws.current = new WebSocket(FASTAPI_WS_URL);

      ws.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'ALERT') {
            addAlert({
              id: Date.now().toString(),
              db: payload.data.db,
              room: payload.data.room,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              severity: payload.data.severity,
              description: payload.data.classification
            });
          }

          if (payload.type === 'READING') {
             // Send high-frequency data to the non-persisted store
             useLiveStore.getState().addReading({
              value: payload.data.db,
              time: payload.data.t, 
              room: payload.data.room
            });
          }
          
          if (payload.type === 'SENSOR_STATUS') {
            updateSensorStatus(payload.sensorId, payload.status);
          }
        } catch (error) {
          console.error('Erro ao fazer parse do payload', error);
        }
      };

      ws.current.onclose = () => {
        console.log('❌ Desconectado do Backend. Tentando reconectar em 5s...');
        reconnectInterval = setTimeout(connect, 5000);
      };
      
      ws.current.onerror = (error) => {
        console.error('Erro no WebSocket: ', error);
        ws.current?.close(); 
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectInterval);
      ws.current?.close();
    };
  }, []);
};