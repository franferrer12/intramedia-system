// Tipos de Usuario y Autenticación
export type RolUsuario = 'ADMIN' | 'GERENTE' | 'ENCARGADO' | 'RRHH' | 'LECTURA';

export interface Usuario {
  id: number;
  username: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface UsuarioFormData {
  username: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  activo?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  rol: string;
}

// Tipos de Eventos
export type TipoEvento = 'REGULAR' | 'ESPECIAL' | 'CONCIERTO' | 'PRIVADO' | 'TEMATICO';
export type EstadoEvento = 'PLANIFICADO' | 'CONFIRMADO' | 'EN_CURSO' | 'FINALIZADO' | 'CANCELADO';

export interface Evento {
  id: number;
  nombre: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  tipo: TipoEvento;
  aforoEsperado?: number;
  aforoReal?: number;
  estado: EstadoEvento;
  precioEntrada?: number;
  artista?: string;
  cacheArtista?: number;
  ingresosEstimados?: number;
  gastosEstimados?: number;
  ingresosReales?: number;
  gastosReales?: number;
  beneficio?: number;
  margen?: number;
  descripcion?: string;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface EventoFormData {
  nombre: string;
  fecha: string;
  horaInicio?: string;
  horaFin?: string;
  tipo: TipoEvento;
  aforoEsperado?: number;
  aforoReal?: number;
  estado?: EstadoEvento;
  precioEntrada?: number;
  artista?: string;
  cacheArtista?: number;
  ingresosEstimados?: number;
  gastosEstimados?: number;
  ingresosReales?: number;
  gastosReales?: number;
  descripcion?: string;
  notas?: string;
}

// Tipos de Dashboard
export interface ProximoEvento {
  id: number;
  nombre: string;
  fecha: string;
  hora: string;
  estado: string;
}

export interface ActividadReciente {
  tipo: string;
  descripcion: string;
  fechaHora: string;
  tiempoRelativo: string;
}

export interface DashboardStats {
  eventosActivos: number;
  totalUsuarios: number;
  totalProveedores: number;
  ingresosMes: number;
  proximosEventos: ProximoEvento[];
  actividadReciente: ActividadReciente[];
}

// Tipos de Proveedores
export type TipoProveedor = 'BEBIDAS' | 'ALIMENTOS' | 'EQUIPAMIENTO' | 'SERVICIOS' | 'OTRO';

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo: TipoProveedor;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface ProveedorFormData {
  nombre: string;
  contacto: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  tipo: TipoProveedor;
  activo?: boolean;
}

// Tipos de Finanzas
export type TipoTransaccion = 'INGRESO' | 'GASTO';

export interface CategoriaTransaccion {
  id: number;
  nombre: string;
  tipo: TipoTransaccion;
  descripcion?: string;
  activa: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CategoriaTransaccionFormData {
  nombre: string;
  tipo: TipoTransaccion;
  descripcion?: string;
  activa?: boolean;
}

export interface Transaccion {
  id: number;
  tipo: TipoTransaccion;
  categoriaId: number;
  categoriaNombre: string;
  eventoId?: number;
  eventoNombre?: string;
  fecha: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  metodoPago?: string;
  referencia?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface TransaccionFormData {
  tipo: TipoTransaccion;
  categoriaId: number;
  eventoId?: number;
  fecha: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  metodoPago?: string;
  referencia?: string;
  proveedorId?: number;
  notas?: string;
}

// Tipos de Empleados
export interface Empleado {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cargo: string;
  departamento?: string;
  fechaAlta: string;
  fechaBaja?: string;
  salarioBase: number;
  tipoContrato?: string;
  numSeguridadSocial?: string;
  cuentaBancaria?: string;
  activo: boolean;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface EmpleadoFormData {
  nombre: string;
  apellidos: string;
  dni: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cargo: string;
  departamento?: string;
  fechaAlta: string;
  fechaBaja?: string;
  salarioBase: number;
  tipoContrato?: string;
  numSeguridadSocial?: string;
  cuentaBancaria?: string;
  activo?: boolean;
  notas?: string;
}

// Tipos de Nóminas
export type EstadoNomina = 'PENDIENTE' | 'PAGADA' | 'CANCELADA';

export interface Nomina {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDni: string;
  periodo: string;
  fechaPago: string;
  salarioBase: number;
  horasExtra: number;
  precioHoraExtra: number;
  bonificaciones: number;
  deducciones: number;
  salarioBruto: number;
  seguridadSocial: number;
  irpf: number;
  otrasRetenciones: number;
  salarioNeto: number;
  estado: EstadoNomina;
  metodoPago?: string;
  referenciaPago?: string;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface NominaFormData {
  empleadoId: number;
  periodo: string;
  fechaPago: string;
  salarioBase: number;
  horasExtra?: number;
  precioHoraExtra?: number;
  bonificaciones?: number;
  deducciones?: number;
  otrasRetenciones?: number;
  estado?: EstadoNomina;
  metodoPago?: string;
  referenciaPago?: string;
  notas?: string;
}

// Tipos de Jornadas de Trabajo
export interface JornadaTrabajo {
  id: number;
  empleadoId: number;
  empleadoNombre: string;
  empleadoDni: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasTrabajadas: number;
  precioHora: number;
  totalPago: number;
  pagado: boolean;
  fechaPago?: string;
  metodoPago?: string;
  eventoId?: number;
  eventoNombre?: string;
  notas?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface JornadaTrabajoFormData {
  empleadoId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  precioHora?: number;
  pagado?: boolean;
  fechaPago?: string;
  metodoPago?: string;
  eventoId?: number;
  notas?: string;
}

// Tipos de respuesta de API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Tipos de Analytics
export interface MesCoste {
  periodo: string;
  total: number;
  cantidadJornadas: number;
  cantidadEmpleados: number;
}

export interface CostesLaborales {
  totalPagadoMes: number;
  totalNominaMes: number;
  cantidadEmpleados: number;
  cantidadJornadas: number;
  promedioCosteJornada: number;
  costePorHora: number;
  periodo: string;
  tendenciaMensual: MesCoste[];
  totalHorasTrabajadas: number;
}

export interface RendimientoEmpleado {
  empleadoId: number;
  empleadoNombre: string;
  totalHorasTrabajadas: number;
  totalJornadas: number;
  totalPagado: number;
  promedioHorasPorJornada: number;
  promedioIngresoPorJornada: number;
  periodoInicio: string;
  periodoFin: string;
  precioPromedioHora: number;
  jornadasPendientes: number;
  importePendiente: number;
}

export interface AnalisisRentabilidad {
  eventoId: number;
  eventoNombre: string;
  eventoFecha: string;
  eventoTipo: string;
  eventoEstado: string;
  ingresosEvento: number;
  costesPersonal: number;
  otrosGastos: number;
  gastosTotal: number;
  margenBruto: number;
  porcentajeMargen: number;
  cantidadEmpleados: number;
  aforoReal?: number;
  ingresoPorPersona: number;
}

export interface DashboardMetrics {
  costesLaboralesMesActual: number;
  costesLaboralesMesAnterior: number;
  variacionMensual: number;
  jornadasPendientesPago: number;
  importePendientePago: number;
  empleadosActivos: number;
  promedioCosteHora: number;
  ultimos6MesesTendencia: MesCoste[];
  mesActual: string;
  mesAnterior: string;
  totalHorasMesActual: number;
  cantidadJornadasMesActual: number;
  nominasPendientes: number;
  totalNominasMesActual: number;
}

// Tipos de Inventario
export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  unidadMedida: string;
  proveedorId?: number;
  proveedorNombre?: string;
  precioCompra: number;
  precioVenta: number;
  margenBeneficio: number;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  activo: boolean;
  perecedero: boolean;
  diasCaducidad?: number;
  imagenUrl?: string;
  bajoStock: boolean;
  sinStock: boolean;
  notas?: string;
  // Campos para modelo de ocio nocturno
  capacidadMl?: number;
  tipoVenta?: TipoVenta;
  mlPorServicio?: number;
  factorMerma?: number;
  unidadesTeorica?: number;
  unidadesReales?: number;
  ingresoTotalEstimado?: number;
  beneficioUnitario?: number;
  margenPorcentaje?: number;
  // Fin campos ocio nocturno
  creadoEn: string;
  actualizadoEn: string;
}

export type TipoVenta = 'COPA' | 'CHUPITO' | 'BOTELLA';

export interface ProductoFormData {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  unidadMedida: string;
  proveedorId?: number;
  precioCompra: number;
  precioVenta: number;
  stockActual?: number;
  stockMinimo: number;
  stockMaximo?: number;
  activo?: boolean;
  perecedero?: boolean;
  diasCaducidad?: number;
  imagenUrl?: string;
  notas?: string;
  // Campos para modelo de ocio nocturno
  capacidadMl?: number;
  tipoVenta?: TipoVenta;
  mlPorServicio?: number;
  factorMerma?: number;
}

export type TipoMovimientoStock = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA' | 'DEVOLUCION' | 'TRASPASO' | 'INVENTARIO';

export interface MovimientoStock {
  id: number;
  productoId: number;
  productoNombre: string;
  productoCodigo: string;
  tipoMovimiento: TipoMovimientoStock;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  precioUnitario?: number;
  costoTotal?: number;
  motivo?: string;
  referencia?: string;
  eventoId?: number;
  eventoNombre?: string;
  proveedorId?: number;
  proveedorNombre?: string;
  usuarioNombre?: string;
  fechaMovimiento: string;
  notas?: string;
  creadoEn: string;
}

export interface MovimientoStockFormData {
  productoId: number;
  tipoMovimiento: TipoMovimientoStock;
  cantidad: number;
  precioUnitario?: number;
  motivo?: string;
  referencia?: string;
  eventoId?: number;
  proveedorId?: number;
  fechaMovimiento?: string;
  notas?: string;
}
