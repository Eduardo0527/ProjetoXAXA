import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';

// Não sei direito como vai funcionar essa parte da conexão com o Radxa

const RADXA_WS_URL = 'ws://<IP_DA_RADXA_ROCK_M3>:8080/audio-stream';

export const useRadxaConnection = () => {
  const ws = useRef<WebSocket | null>(null);
  const addAlert = useAppStore((state) => state.addAlert);
  const updateSensorStatus = useAppStore((state) => state.updateSensorStatus);

  useEffect(() => {
    let reconnectInterval: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws.current = new WebSocket(RADXA_WS_URL);

      ws.current.onopen = () => {
        console.log('✅ Conectado à Radxa Rock M3');
        // Você pode disparar uma ação no Zustand aqui para mudar o status global de "Conectando" para "Online"
      };

      ws.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          // Exemplo: Radxa envia um alerta classificado
          if (payload.type === 'ALERT') {
            addAlert({
              id: Date.now().toString(),
              hz: payload.data.hz,
              db: payload.data.db,
              room: payload.data.room,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              severity: payload.data.severity
            });
          }
          
          // Exemplo: Radxa avisa que um ESP32 caiu ou voltou
          if (payload.type === 'SENSOR_STATUS') {
            updateSensorStatus(payload.sensorId, payload.status);
          }
        } catch (error) {
          console.error('Erro ao fazer parse do payload da Radxa', error);
        }
      };

      ws.current.onclose = () => {
        console.log('❌ Desconectado da Radxa. Tentando reconectar em 5s...');
        reconnectInterval = setTimeout(connect, 5000); // Lógica de reconexão automática
      };
      
      ws.current.onerror = (error) => {
        console.error('Erro no WebSocket: ', error);
        ws.current?.close(); // Força o onclose para tentar reconectar
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectInterval);
      ws.current?.close();
    };
  }, []);
};