import axiosInstance from './axios';

export interface InventoryStats {
  // Estadísticas generales
  totalProductos: number;
  productosActivos: number;
  productosInactivos: number;
  productosBajoStock: number;
  productosSinStock: number;

  // Valor del inventario
  valorTotalInventario: number;
  valorProductosBajoStock: number;

  // Movimientos recientes
  movimientosHoy: number;
  movimientosSemana: number;
  movimientosMes: number;

  // Alertas
  alertasActivas: number;
  alertasCriticas: number;

  // Productos más movidos
  productosMasMovidos: ProductoMovimiento[];

  // Distribución por categoría
  distribucionPorCategoria: Record<string, ProductoCategoriaStats>;
}

export interface ProductoMovimiento {
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  totalMovimientos: number;
  cantidadTotal: number;
}

export interface ProductoCategoriaStats {
  categoria: string;
  cantidadProductos: number;
  valorTotal: number;
  stockTotal: number;
}

export const inventoryStatsApi = {
  getStats: async (): Promise<InventoryStats> => {
    const { data } = await axiosInstance.get('/inventory/stats');
    return data;
  },
};
