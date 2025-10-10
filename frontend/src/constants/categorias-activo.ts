/**
 * Categorías de activos fijos e inversión inicial
 */
export const CATEGORIAS_ACTIVO = [
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'EQUIPAMIENTO', label: 'Equipamiento' },
  { value: 'TECNOLOGIA', label: 'Tecnología' },
  { value: 'MOBILIARIO', label: 'Mobiliario' },
  { value: 'LICENCIAS', label: 'Licencias' },
  { value: 'STOCK_INICIAL', label: 'Stock Inicial' },
  { value: 'VEHICULOS', label: 'Vehículos' },
  { value: 'MARKETING', label: 'Marketing' }, // Solo para inversión inicial
  { value: 'FORMACION', label: 'Formación' }, // Solo para inversión inicial
  { value: 'OTROS', label: 'Otros' }
] as const;

export const CATEGORIAS_ACTIVO_FIJO = CATEGORIAS_ACTIVO.filter(
  c => !['MARKETING', 'FORMACION'].includes(c.value)
);

export const FORMAS_PAGO = [
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'TARJETA', label: 'Tarjeta' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'FINANCIACION', label: 'Financiación' },
  { value: 'OTROS', label: 'Otros' }
] as const;

export const ESTADOS_RECUPERACION = {
  NO_INICIADA: { label: 'No Iniciada', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  EN_PROCESO: { label: 'En Proceso', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  RECUPERADA: { label: 'Recuperada', color: 'text-green-600', bgColor: 'bg-green-100' },
  SUPERADA: { label: 'Superada', color: 'text-purple-600', bgColor: 'bg-purple-100' }
} as const;
