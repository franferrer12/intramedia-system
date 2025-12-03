/**
 * Utilidades de debugging para IndexedDB
 * Usar en consola del navegador: window.debugPOS()
 */

export const debugPendientes = async () => {
  console.log('=== INVESTIGANDO VENTAS PENDIENTES ===');

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('POSOfflineDB', 2);

    dbRequest.onsuccess = (event: any) => {
      const db = event.target.result;

      console.log('Object stores disponibles:', Array.from(db.objectStoreNames));

      if (!db.objectStoreNames.contains('ventasPendientes')) {
        console.error('Store ventasPendientes no existe');
        reject('Store no existe');
        return;
      }

      const transaction = db.transaction(['ventasPendientes'], 'readonly');
      const store = transaction.objectStore('ventasPendientes');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const ventas = getAllRequest.result;
        console.log('\nTotal ventas en DB:', ventas.length);

        const pendientes = ventas.filter((v: any) => v.sincronizada === false);
        console.log('Ventas pendientes:', pendientes.length);

        if (pendientes.length > 0) {
          pendientes.forEach((venta: any, index: number) => {
            console.log(`\n--- VENTA PENDIENTE #${index + 1} ---`);
            console.log('ID:', venta.id);
            console.log('UUID:', venta.uuid);
            console.log('Dispositivo ID:', venta.dispositivoId);
            console.log('Timestamp:', new Date(venta.timestamp).toLocaleString());
            console.log('Total:', venta.total);
            console.log('Metodo de pago:', venta.metodoPago);
            console.log('Monto Efectivo:', venta.montoEfectivo);
            console.log('Monto Tarjeta:', venta.montoTarjeta);
            console.log('Items:', JSON.stringify(venta.items, null, 2));
            console.log('Sincronizada:', venta.sincronizada);
            console.log('Intentos:', venta.intentosSincronizacion);
            console.log('Ultimo intento:', venta.ultimoIntento ? new Date(venta.ultimoIntento).toLocaleString() : 'Nunca');
            console.log('Error:', venta.error || 'Sin error');
          });

          (window as any).ventasPendientes = pendientes;
          console.log('\nVentas guardadas en window.ventasPendientes');
        } else {
          console.log('\nNo hay ventas pendientes');
        }

        resolve(pendientes);
      };

      getAllRequest.onerror = () => {
        console.error('Error al leer ventas:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    };

    dbRequest.onerror = () => {
      console.error('Error al abrir IndexedDB:', dbRequest.error);
      reject(dbRequest.error);
    };
  });
};

export const eliminarVenta = (ventaId: number): Promise<void> => {
  console.log('Eliminando venta con ID:', ventaId);

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('POSOfflineDB', 2);

    dbRequest.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(['ventasPendientes'], 'readwrite');
      const store = transaction.objectStore('ventasPendientes');
      const deleteRequest = store.delete(ventaId);

      deleteRequest.onsuccess = () => {
        console.log('Venta eliminada exitosamente');
        console.log('Recarga la pagina para actualizar el contador');
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error('Error al eliminar:', deleteRequest.error);
        reject(deleteRequest.error);
      };
    };

    dbRequest.onerror = () => {
      console.error('Error al abrir IndexedDB:', dbRequest.error);
      reject(dbRequest.error);
    };
  });
};

export const limpiarTodasLasVentas = (): Promise<void> => {
  console.log('LIMPIANDO TODAS LAS VENTAS PENDIENTES');

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('POSOfflineDB', 2);

    dbRequest.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(['ventasPendientes'], 'readwrite');
      const store = transaction.objectStore('ventasPendientes');
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        console.log('Todas las ventas eliminadas');
        console.log('Recarga la pagina');
        resolve();
      };

      clearRequest.onerror = () => {
        console.error('Error al limpiar:', clearRequest.error);
        reject(clearRequest.error);
      };
    };
  });
};

export const limpiarVentasCorruptas = (): Promise<number> => {
  console.log('🧹 LIMPIANDO VENTAS CORRUPTAS (sin empleadoId)...');

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('POSOfflineDB', 2);

    dbRequest.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(['ventasPendientes'], 'readwrite');
      const store = transaction.objectStore('ventasPendientes');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const ventas = getAllRequest.result || [];
        let eliminadas = 0;

        ventas.forEach((venta: any) => {
          // Eliminar ventas sin empleadoId
          if (!venta.empleadoId) {
            store.delete(venta.id);
            console.log(`🗑️ Eliminando venta corrupta: ${venta.uuid} (sin empleadoId)`);
            eliminadas++;
          }
        });

        transaction.oncomplete = () => {
          console.log(`✅ Limpieza completada: ${eliminadas} ventas eliminadas`);
          console.log('Recarga la página para actualizar el contador');
          resolve(eliminadas);
        };
      };

      getAllRequest.onerror = () => {
        console.error('Error al leer ventas:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    };

    dbRequest.onerror = () => {
      console.error('Error al abrir IndexedDB:', dbRequest.error);
      reject(dbRequest.error);
    };
  });
};

export const limpiarVentasBloqueadas = (): Promise<number> => {
  console.log('🧹 LIMPIANDO VENTAS BLOQUEADAS (10+ intentos o sin empleadoId)...');

  return new Promise((resolve, reject) => {
    const dbRequest = indexedDB.open('POSOfflineDB', 2);

    dbRequest.onsuccess = (event: any) => {
      const db = event.target.result;
      const transaction = db.transaction(['ventasPendientes'], 'readwrite');
      const store = transaction.objectStore('ventasPendientes');
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const ventas = getAllRequest.result || [];
        let eliminadas = 0;

        ventas.forEach((venta: any) => {
          // Eliminar ventas bloqueadas (10+ intentos) O sin empleadoId
          if (venta.intentosSincronizacion >= 10 || !venta.empleadoId) {
            store.delete(venta.id);
            const razon = venta.intentosSincronizacion >= 10 ? '10+ intentos' : 'sin empleadoId';
            console.log(`🗑️ Eliminando venta bloqueada: ${venta.uuid} (${razon})`);
            eliminadas++;
          }
        });

        transaction.oncomplete = () => {
          console.log(`✅ Limpieza completada: ${eliminadas} ventas eliminadas`);
          console.log('🔄 Recargando página en 2 segundos...');
          setTimeout(() => window.location.reload(), 2000);
          resolve(eliminadas);
        };
      };

      getAllRequest.onerror = () => {
        console.error('Error al leer ventas:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    };

    dbRequest.onerror = () => {
      console.error('Error al abrir IndexedDB:', dbRequest.error);
      reject(dbRequest.error);
    };
  });
};

// Exponer funciones globalmente en desarrollo
if (typeof window !== 'undefined') {
  (window as any).debugPOS = debugPendientes;
  (window as any).eliminarVenta = eliminarVenta;
  (window as any).limpiarVentasPOS = limpiarTodasLasVentas;
  (window as any).limpiarVentasCorruptas = limpiarVentasCorruptas;
  (window as any).limpiarVentasBloqueadas = limpiarVentasBloqueadas;
  console.log('🛠️ Funciones de debug POS disponibles:');
  console.log('- debugPOS() - Ver ventas pendientes');
  console.log('- eliminarVenta(id) - Eliminar una venta específica');
  console.log('- limpiarVentasPOS() - Limpiar TODAS las ventas');
  console.log('- limpiarVentasCorruptas() - Limpiar ventas sin empleadoId');
  console.log('- limpiarVentasBloqueadas() - Limpiar ventas con 10+ intentos (RECOMENDADO)');
}
