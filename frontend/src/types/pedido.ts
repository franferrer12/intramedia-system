export type EstadoPedido =
  | 'BORRADOR'
  | 'ENVIADO'
  | 'CONFIRMADO'
  | 'EN_TRANSITO'
  | 'RECIBIDO'
  | 'PARCIAL'
  | 'CANCELADO';

export interface DetallePedido {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCategoria: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  diferencia: number;
  precioUnitario: number;
  subtotal: number;
  notas?: string;
  completamenteRecibido: boolean;
  parcialmenteRecibido: boolean;
  porcentajeRecibido: number;
}

export interface Pedido {
  id: number;
  numeroPedido: string;

  // Proveedor
  proveedorId: number;
  proveedorNombre: string;
  proveedorContacto?: string;

  // Estado y fechas
  estado: EstadoPedido;
  estadoDisplay: string;
  fechaPedido: string;
  fechaEsperada?: string;
  fechaRecepcion?: string;

  // Montos
  subtotal: number;
  impuestos: number;
  total: number;

  // Usuario
  usuarioId: number;
  usuarioNombre: string;
  recepcionadoPorId?: number;
  recepcionadoPorNombre?: string;

  // Transacción financiera
  transaccionId?: number;

  // Notas
  notas?: string;

  // Detalles
  detalles: DetallePedido[];

  // Información calculada
  cantidadTotal: number;
  cantidadRecibida: number;
  puedeEditar: boolean;
  puedeRecepcionar: boolean;
  puedeCancelar: boolean;
  completamenteRecibido: boolean;
  parcialmenteRecibido: boolean;

  // Auditoría
  createdAt: string;
  updatedAt: string;
}

export interface DetallePedidoRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  notas?: string;
}

export interface CrearPedidoRequest {
  proveedorId: number;
  fechaEsperada?: string;
  notas?: string;
  detalles: DetallePedidoRequest[];
}

export interface DetalleRecepcionRequest {
  detalleId: number;
  cantidadRecibida: number;
  notas?: string;
}

export interface RecepcionarPedidoRequest {
  detallesRecepcion: DetalleRecepcionRequest[];
  notas?: string;
}

// Utilidades para colores de badges
export const ESTADO_COLORS: Record<EstadoPedido, string> = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ENVIADO: 'bg-blue-100 text-blue-800',
  CONFIRMADO: 'bg-indigo-100 text-indigo-800',
  EN_TRANSITO: 'bg-purple-100 text-purple-800',
  RECIBIDO: 'bg-green-100 text-green-800',
  PARCIAL: 'bg-yellow-100 text-yellow-800',
  CANCELADO: 'bg-red-100 text-red-800',
};
