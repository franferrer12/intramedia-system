/**
 * IndexedDB utilities for offline POS sales storage
 *
 * Database: POSOfflineDB
 * Stores:
 * - ventasPendientes: Sales waiting to be synced
 * - productosCache: Cached products for offline use
 * - configuracionCache: Device configuration cache
 */

const DB_NAME = 'POSOfflineDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  VENTAS_PENDIENTES: 'ventasPendientes',
  PRODUCTOS_CACHE: 'productosCache',
  CONFIGURACION_CACHE: 'configuracionCache',
} as const;

export interface VentaOfflineDB {
  id?: number;
  uuid: string;
  dispositivoId: number;
  timestamp: number;
  items: VentaItemDB[];
  total: number;
  metodoPago?: string;
  empleadoId?: number;
  empleadoNombre?: string;
  sincronizada: boolean;
  intentosSincronizacion: number;
  ultimoIntento?: number;
  error?: string;
}

export interface VentaItemDB {
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ProductoCacheDB {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock?: number;
  activo: boolean;
  timestamp: number;
}

export interface ConfiguracionCacheDB {
  dispositivoId: number;
  timestamp: number;
  data: any;
}

/**
 * Initialize IndexedDB database
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Error al abrir IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Store: ventasPendientes
      if (!db.objectStoreNames.contains(STORES.VENTAS_PENDIENTES)) {
        const ventasStore = db.createObjectStore(STORES.VENTAS_PENDIENTES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        ventasStore.createIndex('uuid', 'uuid', { unique: true });
        ventasStore.createIndex('dispositivoId', 'dispositivoId', { unique: false });
        ventasStore.createIndex('sincronizada', 'sincronizada', { unique: false });
        ventasStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store: productosCache
      if (!db.objectStoreNames.contains(STORES.PRODUCTOS_CACHE)) {
        const productosStore = db.createObjectStore(STORES.PRODUCTOS_CACHE, {
          keyPath: 'id',
        });
        productosStore.createIndex('categoria', 'categoria', { unique: false });
        productosStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Store: configuracionCache
      if (!db.objectStoreNames.contains(STORES.CONFIGURACION_CACHE)) {
        db.createObjectStore(STORES.CONFIGURACION_CACHE, {
          keyPath: 'dispositivoId',
        });
      }
    };
  });
};

/**
 * Add a sale to the pending sync queue
 */
export const addVentaPendiente = async (venta: VentaOfflineDB): Promise<number> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);

    const request = store.add(venta);

    request.onsuccess = () => {
      resolve(request.result as number);
    };

    request.onerror = () => {
      reject(new Error('Error al guardar venta offline'));
    };
  });
};

/**
 * Get all pending sales
 */
export const getVentasPendientes = async (): Promise<VentaOfflineDB[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readonly');
      const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);

      // Usar getAll en lugar de index para evitar problemas con valores inválidos
      const request = store.getAll();

      request.onsuccess = () => {
        const ventas = request.result || [];
        // Filtrar manualmente las ventas no sincronizadas
        const pendientes = ventas.filter((v: VentaOfflineDB) => v.sincronizada === false);
        resolve(pendientes);
      };

      request.onerror = () => {
        console.warn('Error al obtener ventas pendientes, retornando array vacío');
        resolve([]);
      };
    });
  } catch (error) {
    console.warn('Error al acceder a IndexedDB, retornando array vacío:', error);
    return [];
  }
};

/**
 * Update a pending sale
 */
export const updateVentaPendiente = async (id: number, updates: Partial<VentaOfflineDB>): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);

    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const venta = getRequest.result;
      if (!venta) {
        reject(new Error('Venta no encontrada'));
        return;
      }

      const ventaActualizada = { ...venta, ...updates };
      const updateRequest = store.put(ventaActualizada);

      updateRequest.onsuccess = () => {
        resolve();
      };

      updateRequest.onerror = () => {
        reject(new Error('Error al actualizar venta'));
      };
    };

    getRequest.onerror = () => {
      reject(new Error('Error al obtener venta'));
    };
  });
};

/**
 * Delete a pending sale
 */
export const deleteVentaPendiente = async (id: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readwrite');
    const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);

    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Error al eliminar venta'));
    };
  });
};

/**
 * Cache products for offline use
 */
export const cacheProductos = async (productos: ProductoCacheDB[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PRODUCTOS_CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.PRODUCTOS_CACHE);

    // Clear existing cache
    store.clear();

    // Add new products
    productos.forEach(producto => {
      store.add(producto);
    });

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error('Error al cachear productos'));
    };
  });
};

/**
 * Get cached products
 */
export const getCachedProductos = async (): Promise<ProductoCacheDB[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.PRODUCTOS_CACHE], 'readonly');
    const store = transaction.objectStore(STORES.PRODUCTOS_CACHE);

    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error('Error al obtener productos cacheados'));
    };
  });
};

/**
 * Cache device configuration
 */
export const cacheConfiguracion = async (config: ConfiguracionCacheDB): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONFIGURACION_CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CONFIGURACION_CACHE);

    const request = store.put(config);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error('Error al cachear configuración'));
    };
  });
};

/**
 * Get cached configuration
 */
export const getCachedConfiguracion = async (dispositivoId: number): Promise<ConfiguracionCacheDB | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.CONFIGURACION_CACHE], 'readonly');
    const store = transaction.objectStore(STORES.CONFIGURACION_CACHE);

    const request = store.get(dispositivoId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error('Error al obtener configuración cacheada'));
    };
  });
};

/**
 * Get count of pending sales
 */
export const getVentasPendientesCount = async (): Promise<number> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.VENTAS_PENDIENTES], 'readonly');
      const store = transaction.objectStore(STORES.VENTAS_PENDIENTES);

      // Usar getAll en lugar de index para evitar problemas con valores inválidos
      const request = store.getAll();

      request.onsuccess = () => {
        const ventas = request.result || [];
        // Filtrar manualmente las ventas no sincronizadas
        const pendientes = ventas.filter((v: VentaOfflineDB) => v.sincronizada === false);
        resolve(pendientes.length);
      };

      request.onerror = () => {
        // Si falla, retornar 0 en lugar de rechazar
        console.warn('Error al contar ventas pendientes, retornando 0');
        resolve(0);
      };
    });
  } catch (error) {
    console.warn('Error al acceder a IndexedDB, retornando 0:', error);
    return 0;
  }
};

/**
 * Clear all data (useful for logout)
 */
export const clearAllData = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.VENTAS_PENDIENTES, STORES.PRODUCTOS_CACHE, STORES.CONFIGURACION_CACHE],
      'readwrite'
    );

    transaction.objectStore(STORES.VENTAS_PENDIENTES).clear();
    transaction.objectStore(STORES.PRODUCTOS_CACHE).clear();
    transaction.objectStore(STORES.CONFIGURACION_CACHE).clear();

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(new Error('Error al limpiar datos'));
    };
  });
};
