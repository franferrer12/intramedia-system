import { useEffect, useRef, useState } from 'react';
import { dispositivosPosApi } from '../api/dispositivos-pos.api';
import { toast } from 'sonner';

export type HeartbeatStatus = 'connected' | 'disconnected' | 'error';

const MAX_CONSECUTIVE_FAILURES = 3;

/**
 * Hook para enviar heartbeats periódicos al backend
 * Mantiene actualizado el estado de conexión del dispositivo POS
 *
 * @param dispositivoId - ID del dispositivo POS
 * @param enabled - Si el heartbeat está habilitado (default: true)
 * @param intervalMs - Intervalo entre heartbeats en milisegundos (default: 30000 = 30s)
 */
export const useHeartbeat = (
  dispositivoId: number,
  enabled: boolean = true,
  intervalMs: number = 30000 // 30 segundos por defecto
) => {
  const intervalRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const [status, setStatus] = useState<HeartbeatStatus>('connected');
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const hasShownErrorToast = useRef(false);

  useEffect(() => {
    if (!enabled || !dispositivoId) {
      return;
    }

    // Función para enviar heartbeat
    const sendHeartbeat = async () => {
      try {
        await dispositivosPosApi.registrarHeartbeat(dispositivoId);
        lastHeartbeatRef.current = Date.now();

        // Reset estado si estaba en error
        if (consecutiveFailures > 0) {
          setConsecutiveFailures(0);
          setStatus('connected');
          hasShownErrorToast.current = false;
          console.log(`[Heartbeat] ✅ Conexión restaurada para dispositivo ${dispositivoId}`);
          toast.success('Conexión con el servidor restaurada');
        } else {
          console.log(`[Heartbeat] ✅ Enviado para dispositivo ${dispositivoId}`);
        }
      } catch (error: any) {
        const newFailureCount = consecutiveFailures + 1;
        setConsecutiveFailures(newFailureCount);

        // Si es error 403 (Forbidden), probablemente el token expiró
        // Detener el heartbeat inmediatamente para evitar spam de errores
        if (error.response?.status === 403) {
          console.error(`[Heartbeat] 🛑 Error 403 Forbidden - Token probablemente expirado. Deteniendo heartbeat.`);
          setStatus('error');

          // DETENER el intervalo inmediatamente
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Mostrar notificación
          if (!hasShownErrorToast.current) {
            toast.error('Sesión expirada', {
              description: 'Tu sesión ha expirado. Por favor, vuelve a emparejar el dispositivo.',
              duration: 10000,
            });
            hasShownErrorToast.current = true;
          }
          return; // Salir inmediatamente
        }

        console.error(`[Heartbeat] ❌ Error para dispositivo ${dispositivoId} (intento ${newFailureCount}):`, error);

        // Después de MAX_CONSECUTIVE_FAILURES intentos fallidos, marcar como error
        if (newFailureCount >= MAX_CONSECUTIVE_FAILURES) {
          setStatus('error');

          // Mostrar notificación solo una vez
          if (!hasShownErrorToast.current) {
            toast.warning('Problema de conexión con el servidor', {
              description: 'Continuarás trabajando en modo offline. Las ventas se sincronizarán automáticamente cuando se restaure la conexión.',
              duration: 5000,
            });
            hasShownErrorToast.current = true;
          }
        } else {
          setStatus('disconnected');
        }
      }
    };

    // Enviar heartbeat inicial inmediatamente
    sendHeartbeat();

    // Configurar intervalo para enviar heartbeats periódicos
    intervalRef.current = setInterval(sendHeartbeat, intervalMs) as unknown as number;

    // Cleanup: limpiar intervalo al desmontar o cambiar dependencies
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispositivoId, enabled, intervalMs, consecutiveFailures]);

  return {
    lastHeartbeat: lastHeartbeatRef.current,
    status,
    consecutiveFailures,
    isConnected: status === 'connected',
  };
};
