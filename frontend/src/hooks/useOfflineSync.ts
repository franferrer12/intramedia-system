import { useState, useEffect, useCallback, useRef } from 'react';
import { dispositivosPosApi, VentaOffline } from '../api/dispositivos-pos.api';
import {
  getVentasPendientes,
  updateVentaPendiente,
  deleteVentaPendiente,
  getVentasPendientesCount,
  VentaOfflineDB,
} from '../utils/offlineDB';

const SYNC_INTERVAL = 30000; // 30 segundos
const MAX_RETRY_ATTEMPTS = 10;
const BASE_RETRY_DELAY = 1000; // 1 segundo

export interface OfflineSyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  syncErrors: string[];
}

export const useOfflineSync = (dispositivoId: number | null, isOnline: boolean) => {
  const [state, setState] = useState<OfflineSyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncErrors: [],
  });

  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncingRef = useRef(false);

  /**
   * Calculate exponential backoff delay
   */
  const calculateRetryDelay = (attemptNumber: number): number => {
    return Math.min(BASE_RETRY_DELAY * Math.pow(2, attemptNumber), 60000); // Max 1 minuto
  };

  /**
   * Sync a single sale
   */
  const syncVenta = async (venta: VentaOfflineDB): Promise<boolean> => {
    if (!dispositivoId) return false;

    try {
      // ⚠️ VALIDACIÓN CRÍTICA: Verificar que los montos no sean undefined
      // Si son undefined, significa que es una venta antigua corrupta que debe eliminarse
      if (venta.montoEfectivo === undefined || venta.montoTarjeta === undefined) {
        console.error('❌ Venta corrupta detectada (montos undefined):', venta.uuid);

        // Eliminar venta corrupta de IndexedDB
        if (venta.id) {
          await deleteVentaPendiente(venta.id);
          console.log('🗑️ Venta corrupta eliminada:', venta.uuid);
        }

        return false; // No intentar sincronizar
      }

      // Convert to API format
      const ventaAPI: VentaOffline = {
        uuidVenta: venta.uuid,
        datosVenta: {
          timestamp: venta.timestamp,
          fechaVenta: venta.fechaVenta, // ⭐ Real sale creation time (ISO string)
          items: venta.items.map(item => ({
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
          })),
          total: venta.total,
          metodoPago: venta.metodoPago,
          montoEfectivo: venta.montoEfectivo,
          montoTarjeta: venta.montoTarjeta,
          empleadoId: venta.empleadoId,  // ⭐ CRÍTICO: Incluir empleadoId para multi-dispositivo
          empleadoNombre: venta.empleadoNombre,
        },
      };

      console.log('📤 Sincronizando venta:', {
        uuid: venta.uuid,
        total: venta.total,
        metodoPago: venta.metodoPago,
        montoEfectivo: venta.montoEfectivo,
        montoTarjeta: venta.montoTarjeta,
      });

      // Send to API
      console.log('🌐 Enviando petición al backend...', {
        dispositivoId,
        ventaUUID: venta.uuid,
        payload: ventaAPI
      });

      const resultado = await dispositivosPosApi.sincronizarVentasOffline(
        [ventaAPI],
        dispositivoId
      );

      console.log('📥 Respuesta del backend:', JSON.stringify(resultado, null, 2));

      if (resultado.length > 0 && resultado[0].exitoso) {
        // Delete from IndexedDB on success
        if (venta.id) {
          await deleteVentaPendiente(venta.id);
        }
        return true;
      } else {
        // Update retry info on failure
        if (venta.id) {
          await updateVentaPendiente(venta.id, {
            intentosSincronizacion: venta.intentosSincronizacion + 1,
            ultimoIntento: Date.now(),
            error: resultado[0]?.mensaje || 'Error desconocido',
          });
        }
        return false;
      }
    } catch (error: any) {
      // Update retry info on exception
      console.error('❌ Error al sincronizar venta:', {
        uuid: venta.uuid,
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });

      if (venta.id) {
        await updateVentaPendiente(venta.id, {
          intentosSincronizacion: venta.intentosSincronizacion + 1,
          ultimoIntento: Date.now(),
          error: error.response?.data?.message || error.message || 'Error de red',
        });
      }
      return false;
    }
  };

  /**
   * Sync all pending sales
   */
  const syncAllPending = useCallback(async (): Promise<void> => {
    if (!isOnline || !dispositivoId || isSyncingRef.current) {
      console.log('⏸️ Sync pausado:', { isOnline, dispositivoId, isSyncing: isSyncingRef.current });
      return;
    }

    console.log('🔄 Iniciando sync automático...');
    isSyncingRef.current = true;
    setState(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));

    try {
      const ventas = await getVentasPendientes();
      console.log(`📦 Ventas pendientes encontradas: ${ventas.length}`);
      const errors: string[] = [];

      for (const venta of ventas) {
        // Check if we should retry (exponential backoff)
        if (venta.intentosSincronizacion >= MAX_RETRY_ATTEMPTS) {
          errors.push(`Venta ${venta.uuid}: Máximo de intentos alcanzado`);
          continue;
        }

        if (venta.ultimoIntento) {
          const retryDelay = calculateRetryDelay(venta.intentosSincronizacion);
          const timeSinceLastAttempt = Date.now() - venta.ultimoIntento;

          if (timeSinceLastAttempt < retryDelay) {
            // Skip this venta, not ready to retry yet
            continue;
          }
        }

        // Try to sync
        const success = await syncVenta(venta);

        if (!success) {
          errors.push(`Venta ${venta.uuid}: ${venta.error || 'Error al sincronizar'}`);
        }
      }

      // Update pending count
      const count = await getVentasPendientesCount();
      console.log(`✅ Sync completado. Pendientes: ${count}, Errores: ${errors.length}`);

      setState(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: count,
        lastSyncTime: Date.now(),
        syncErrors: errors,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isSyncing: false,
        syncErrors: [error.message || 'Error al sincronizar'],
      }));
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, dispositivoId]);

  /**
   * Update pending count
   */
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getVentasPendientesCount();
      setState(prev => ({ ...prev, pendingCount: count }));
    } catch (error) {
      console.error('Error al actualizar contador de ventas pendientes:', error);
    }
  }, []);

  /**
   * Manual sync trigger
   */
  const triggerSync = useCallback(() => {
    syncAllPending();
  }, [syncAllPending]);

  // Initialize pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Setup automatic sync interval
  useEffect(() => {
    if (!isOnline || !dispositivoId) {
      // Clear interval if offline or no device
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      console.log('⏹️ Sync interval detenido (offline o sin dispositivo)');
      return;
    }

    console.log(`🔁 Sync automático activado (cada ${SYNC_INTERVAL/1000}s) para dispositivo ID=${dispositivoId}`);

    // Initial sync when coming online
    syncAllPending();

    // Setup interval
    syncIntervalRef.current = setInterval(() => {
      console.log('⏰ Ejecutando sync programado...');
      syncAllPending();
    }, SYNC_INTERVAL);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isOnline, dispositivoId, syncAllPending]);

  // Listen for online event
  useEffect(() => {
    const handleOnline = () => {
      console.log('📡 Conexión restaurada, sincronizando...');
      syncAllPending();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [syncAllPending]);

  return {
    ...state,
    triggerSync,
    updatePendingCount,
  };
};
