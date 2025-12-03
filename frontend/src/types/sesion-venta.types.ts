export interface SesionVenta {
  id: number;
  codigo: string;
  nombre: string;
  estado: 'ABIERTA' | 'CERRADA' | 'CANCELADA';
  empleadoId?: number;
  empleadoNombre?: string;
  valorTotal: number;
  totalItems: number;
  duracionMinutos: number;
  fechaApertura: string;
  fechaCierre?: string;
  creadoPor?: string;
}

export interface ConsumoSesion {
  id: number;
  sesionId: number;
  productoId: number;
  productoNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  tipoVenta?: string;
  notas?: string;
  fechaRegistro: string;
  registradoPor?: string;
}

export interface SesionVentaRequest {
  nombre: string;
  empleadoId?: number;
}

export interface RegistrarConsumoRequest {
  sesionId: number;
  productoId: number;
  cantidad: number;
  notas?: string;
}

export interface CerrarSesionRequest {
  sesionId: number;
  notas?: string;
}
