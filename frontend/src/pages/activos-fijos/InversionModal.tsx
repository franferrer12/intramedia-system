import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import inversionInicialApi, { InversionInicial, InversionInicialRequest } from '../../api/inversion-inicial.api';
import { CATEGORIAS_ACTIVO, FORMAS_PAGO } from '../../constants/categorias-activo';

// Schema de validación
const inversionSchema = z.object({
  concepto: z.string().min(1, 'El concepto es requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, 'La categoría es requerida'),
  monto: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  activoFijoId: z.number().optional(),
  proveedorId: z.number().optional(),
  numeroFactura: z.string().max(100, 'Máximo 100 caracteres').optional(),
  formaPago: z.string().optional()
});

type InversionFormData = z.infer<typeof inversionSchema>;

interface InversionModalProps {
  inversion: InversionInicial | null;
  onClose: () => void;
}

export default function InversionModal({ inversion, onClose }: InversionModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<InversionFormData>({
    resolver: zodResolver(inversionSchema),
    defaultValues: inversion
      ? {
          concepto: inversion.concepto,
          descripcion: inversion.descripcion || '',
          categoria: inversion.categoria,
          monto: inversion.monto,
          fecha: inversion.fecha,
          activoFijoId: inversion.activoFijoId,
          proveedorId: inversion.proveedorId,
          numeroFactura: inversion.numeroFactura || '',
          formaPago: inversion.formaPago || ''
        }
      : {
          fecha: new Date().toISOString().split('T')[0]
        }
  });

  const mutation = useMutation({
    mutationFn: (data: InversionInicialRequest) =>
      inversion ? inversionInicialApi.update(inversion.id, data) : inversionInicialApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inversiones-iniciales'] });
      queryClient.invalidateQueries({ queryKey: ['inversion-total'] });
      toast.success(inversion ? 'Inversión actualizada correctamente' : 'Inversión creada correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar la inversión');
    }
  });

  const onSubmit = (data: InversionFormData) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (inversion) {
      reset({
        concepto: inversion.concepto,
        descripcion: inversion.descripcion || '',
        categoria: inversion.categoria,
        monto: inversion.monto,
        fecha: inversion.fecha,
        activoFijoId: inversion.activoFijoId,
        proveedorId: inversion.proveedorId,
        numeroFactura: inversion.numeroFactura || '',
        formaPago: inversion.formaPago || ''
      });
    }
  }, [inversion, reset]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {inversion ? 'Editar Inversión' : 'Nueva Inversión'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('concepto')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.concepto ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Reforma del local"
                />
                {errors.concepto && (
                  <p className="mt-1 text-sm text-red-500">{errors.concepto.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descripción detallada de la inversión"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('categoria')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoria ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {CATEGORIAS_ACTIVO.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="mt-1 text-sm text-red-500">{errors.categoria.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forma de Pago
                </label>
                <select
                  {...register('formaPago')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar forma de pago</option>
                  {FORMAS_PAGO.map(forma => (
                    <option key={forma.value} value={forma.value}>
                      {forma.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Datos financieros */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Datos Financieros</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('monto', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.monto ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.monto && (
                  <p className="mt-1 text-sm text-red-500">{errors.monto.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('fecha')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fecha ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha && (
                  <p className="mt-1 text-sm text-red-500">{errors.fecha.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Factura
                </label>
                <input
                  type="text"
                  {...register('numeroFactura')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: FAC-2024-001"
                />
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Información Adicional (Opcional)</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Si esta inversión está relacionada con un activo fijo específico o un proveedor,
                podrás vincularlos posteriormente desde las pantallas de activos fijos o proveedores.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Guardando...' : inversion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
