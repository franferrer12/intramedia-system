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

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
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
      // Convert to API format
      const ventaAPI: VentaOffline = {
        uuid: venta.uuid,
        timestamp: venta.timestamp,
        items: venta.items.map(item => ({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
        })),
        total: venta.total,
        metodoPago: venta.metodoPago,
      };

      // Send to API
      const resultado = await dispositivosPosApi.sincronizarVentasOffline(
        [ventaAPI],
        dispositivoId
      );

      if (resultado.length > 0 && resultado[0].exito) {
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
      if (venta.id) {
        await updateVentaPendiente(venta.id, {
          intentosSincronizacion: venta.intentosSincronizacion + 1,
          ultimoIntento: Date.now(),
          error: error.message || 'Error de red',
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
      return;
    }

    isSyncingRef.current = true;
    setState(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));

    try {
      const ventas = await getVentasPendientes();
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
      return;
    }

    // Initial sync when coming online
    syncAllPending();

    // Setup interval
    syncIntervalRef.current = setInterval(() => {
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
