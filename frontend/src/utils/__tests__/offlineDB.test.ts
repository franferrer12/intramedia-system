import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  initDB,
  addVentaPendiente,
  getVentasPendientes,
  updateVentaPendiente,
  deleteVentaPendiente,
  getVentasPendientesCount,
  cacheProductos,
  getCachedProductos,
  cacheConfiguracion,
  getCachedConfiguracion,
  clearAllData,
  VentaOfflineDB,
  ProductoCacheDB,
  ConfiguracionCacheDB,
} from '../offlineDB';

describe('offlineDB', () => {
  beforeEach(async () => {
    // Clear all data before each test
    await clearAllData();
  });

  afterEach(async () => {
    // Clean up after each test
    await clearAllData();
  });

  describe('initDB', () => {
    it('should initialize database successfully', async () => {
      const db = await initDB();
      expect(db).toBeDefined();
      expect(db.name).toBe('POSOfflineDB');
      expect(db.version).toBe(1);
    });

    it('should create all required object stores', async () => {
      const db = await initDB();
      expect(db.objectStoreNames.contains('ventasPendientes')).toBe(true);
      expect(db.objectStoreNames.contains('productosCache')).toBe(true);
      expect(db.objectStoreNames.contains('configuracionCache')).toBe(true);
    });
  });

  describe('Ventas Pendientes', () => {
    it('should add a venta pendiente', async () => {
      const venta: VentaOfflineDB = {
        uuid: 'test-uuid-123',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [
          {
            productoId: 1,
            productoNombre: 'Coca Cola',
            cantidad: 2,
            precioUnitario: 2.5,
            subtotal: 5.0,
          },
        ],
        total: 5.0,
        metodoPago: 'EFECTIVO',
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const id = await addVentaPendiente(venta);
      expect(id).toBeGreaterThan(0);
    });

    it('should get all ventas pendientes', async () => {
      const venta1: VentaOfflineDB = {
        uuid: 'venta-1',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 10.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const venta2: VentaOfflineDB = {
        uuid: 'venta-2',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 20.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      await addVentaPendiente(venta1);
      await addVentaPendiente(venta2);

      const ventas = await getVentasPendientes();
      expect(ventas).toHaveLength(2);
      expect(ventas[0].uuid).toBe('venta-1');
      expect(ventas[1].uuid).toBe('venta-2');
    });

    it('should get count of ventas pendientes', async () => {
      const venta1: VentaOfflineDB = {
        uuid: 'venta-1',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 10.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const venta2: VentaOfflineDB = {
        uuid: 'venta-2',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 20.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      await addVentaPendiente(venta1);
      await addVentaPendiente(venta2);

      const count = await getVentasPendientesCount();
      expect(count).toBe(2);
    });

    it('should update a venta pendiente', async () => {
      const venta: VentaOfflineDB = {
        uuid: 'venta-update',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 10.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const id = await addVentaPendiente(venta);

      await updateVentaPendiente(id, {
        intentosSincronizacion: 3,
        ultimoIntento: Date.now(),
        error: 'Network error',
      });

      const ventas = await getVentasPendientes();
      expect(ventas[0].intentosSincronizacion).toBe(3);
      expect(ventas[0].error).toBe('Network error');
      expect(ventas[0].ultimoIntento).toBeDefined();
    });

    it('should delete a venta pendiente', async () => {
      const venta: VentaOfflineDB = {
        uuid: 'venta-delete',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 10.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const id = await addVentaPendiente(venta);

      await deleteVentaPendiente(id);

      const count = await getVentasPendientesCount();
      expect(count).toBe(0);
    });

    it('should not return synchronized ventas', async () => {
      const ventaSincronizada: VentaOfflineDB = {
        uuid: 'venta-sync',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 10.0,
        sincronizada: true, // Ya sincronizada
        intentosSincronizacion: 1,
      };

      const ventaPendiente: VentaOfflineDB = {
        uuid: 'venta-pending',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 20.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const id1 = await addVentaPendiente(ventaSincronizada);
      await addVentaPendiente(ventaPendiente);

      // Update the first one to mark as synchronized
      await updateVentaPendiente(id1, { sincronizada: true });

      const ventas = await getVentasPendientes();
      expect(ventas).toHaveLength(1);
      expect(ventas[0].uuid).toBe('venta-pending');
    });
  });

  describe('Productos Cache', () => {
    it('should cache productos', async () => {
      const productos: ProductoCacheDB[] = [
        {
          id: 1,
          nombre: 'Coca Cola',
          categoria: 'Bebidas',
          precio: 2.5,
          stock: 100,
          activo: true,
          timestamp: Date.now(),
        },
        {
          id: 2,
          nombre: 'Sprite',
          categoria: 'Bebidas',
          precio: 2.0,
          stock: 50,
          activo: true,
          timestamp: Date.now(),
        },
      ];

      await cacheProductos(productos);

      const cached = await getCachedProductos();
      expect(cached).toHaveLength(2);
      expect(cached[0].nombre).toBe('Coca Cola');
      expect(cached[1].nombre).toBe('Sprite');
    });

    it('should replace existing cache when caching productos', async () => {
      const productos1: ProductoCacheDB[] = [
        {
          id: 1,
          nombre: 'Producto 1',
          categoria: 'Cat1',
          precio: 10.0,
          activo: true,
          timestamp: Date.now(),
        },
      ];

      const productos2: ProductoCacheDB[] = [
        {
          id: 2,
          nombre: 'Producto 2',
          categoria: 'Cat2',
          precio: 20.0,
          activo: true,
          timestamp: Date.now(),
        },
      ];

      await cacheProductos(productos1);
      await cacheProductos(productos2);

      const cached = await getCachedProductos();
      expect(cached).toHaveLength(1);
      expect(cached[0].nombre).toBe('Producto 2');
    });

    it('should get empty array when no productos cached', async () => {
      const cached = await getCachedProductos();
      expect(cached).toHaveLength(0);
    });
  });

  describe('Configuracion Cache', () => {
    it('should cache configuracion', async () => {
      const config: ConfiguracionCacheDB = {
        dispositivoId: 1,
        timestamp: Date.now(),
        data: {
          nombre: 'Caja 1',
          productos: [1, 2, 3],
          permisos: { vender: true, descuentos: false },
        },
      };

      await cacheConfiguracion(config);

      const cached = await getCachedConfiguracion(1);
      expect(cached).toBeDefined();
      expect(cached?.dispositivoId).toBe(1);
      expect(cached?.data.nombre).toBe('Caja 1');
    });

    it('should return null when no configuracion cached', async () => {
      const cached = await getCachedConfiguracion(999);
      expect(cached).toBeNull();
    });

    it('should update existing configuracion', async () => {
      const config1: ConfiguracionCacheDB = {
        dispositivoId: 1,
        timestamp: Date.now(),
        data: { version: 1 },
      };

      const config2: ConfiguracionCacheDB = {
        dispositivoId: 1,
        timestamp: Date.now() + 1000,
        data: { version: 2 },
      };

      await cacheConfiguracion(config1);
      await cacheConfiguracion(config2);

      const cached = await getCachedConfiguracion(1);
      expect(cached?.data.version).toBe(2);
    });
  });

  describe('clearAllData', () => {
    it('should clear all data from all stores', async () => {
      // Add data to all stores
      const venta: VentaOfflineDB = {
        uuid: 'test',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [],
        total: 10.0,
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const productos: ProductoCacheDB[] = [
        {
          id: 1,
          nombre: 'Producto',
          categoria: 'Cat',
          precio: 10.0,
          activo: true,
          timestamp: Date.now(),
        },
      ];

      const config: ConfiguracionCacheDB = {
        dispositivoId: 1,
        timestamp: Date.now(),
        data: {},
      };

      await addVentaPendiente(venta);
      await cacheProductos(productos);
      await cacheConfiguracion(config);

      // Clear all
      await clearAllData();

      // Verify all stores are empty
      const ventasCount = await getVentasPendientesCount();
      const productosCache = await getCachedProductos();
      const configCache = await getCachedConfiguracion(1);

      expect(ventasCount).toBe(0);
      expect(productosCache).toHaveLength(0);
      expect(configCache).toBeNull();
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple ventas with different estados', async () => {
      const ventas: VentaOfflineDB[] = [
        {
          uuid: 'venta-1',
          dispositivoId: 1,
          timestamp: Date.now(),
          items: [],
          total: 10.0,
          sincronizada: false,
          intentosSincronizacion: 0,
        },
        {
          uuid: 'venta-2',
          dispositivoId: 1,
          timestamp: Date.now(),
          items: [],
          total: 20.0,
          sincronizada: false,
          intentosSincronizacion: 3,
          ultimoIntento: Date.now() - 60000,
          error: 'Network timeout',
        },
        {
          uuid: 'venta-3',
          dispositivoId: 1,
          timestamp: Date.now(),
          items: [],
          total: 30.0,
          sincronizada: false,
          intentosSincronizacion: 10,
          error: 'Max retries reached',
        },
      ];

      for (const venta of ventas) {
        await addVentaPendiente(venta);
      }

      const pendientes = await getVentasPendientes();
      expect(pendientes).toHaveLength(3);

      const ventaConError = pendientes.find((v) => v.uuid === 'venta-2');
      expect(ventaConError?.error).toBe('Network timeout');
      expect(ventaConError?.intentosSincronizacion).toBe(3);

      const ventaMaxRetries = pendientes.find((v) => v.uuid === 'venta-3');
      expect(ventaMaxRetries?.intentosSincronizacion).toBe(10);
    });

    it('should handle venta with multiple items', async () => {
      const venta: VentaOfflineDB = {
        uuid: 'venta-multi-items',
        dispositivoId: 1,
        timestamp: Date.now(),
        items: [
          {
            productoId: 1,
            productoNombre: 'Coca Cola',
            cantidad: 2,
            precioUnitario: 2.5,
            subtotal: 5.0,
          },
          {
            productoId: 2,
            productoNombre: 'Sprite',
            cantidad: 3,
            precioUnitario: 2.0,
            subtotal: 6.0,
          },
          {
            productoId: 3,
            productoNombre: 'Agua',
            cantidad: 1,
            precioUnitario: 1.5,
            subtotal: 1.5,
          },
        ],
        total: 12.5,
        metodoPago: 'TARJETA',
        sincronizada: false,
        intentosSincronizacion: 0,
      };

      const id = await addVentaPendiente(venta);
      expect(id).toBeGreaterThan(0);

      const ventas = await getVentasPendientes();
      expect(ventas[0].items).toHaveLength(3);
      expect(ventas[0].total).toBe(12.5);
      expect(ventas[0].metodoPago).toBe('TARJETA');
    });
  });
});
