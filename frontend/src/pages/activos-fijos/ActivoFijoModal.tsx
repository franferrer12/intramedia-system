import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import activosFijosApi, { ActivoFijo, ActivoFijoRequest } from '../../api/activos-fijos.api';
import { CATEGORIAS_ACTIVO_FIJO } from '../../constants/categorias-activo';

// Schema de validación
const activoFijoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200, 'Máximo 200 caracteres'),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, 'La categoría es requerida'),
  valorInicial: z.number().min(0.01, 'El valor inicial debe ser mayor a 0'),
  fechaAdquisicion: z.string().min(1, 'La fecha de adquisición es requerida'),
  vidaUtilAnios: z.number().int().min(1, 'La vida útil debe ser al menos 1 año').max(100, 'Máximo 100 años'),
  valorResidual: z.number().min(0, 'El valor residual no puede ser negativo').optional().default(0),
  proveedorId: z.number().optional(),
  numeroFactura: z.string().max(100, 'Máximo 100 caracteres').optional(),
  ubicacion: z.string().max(200, 'Máximo 200 caracteres').optional(),
  activo: z.boolean().optional().default(true),
  notas: z.string().optional()
});

type ActivoFijoFormData = z.infer<typeof activoFijoSchema>;

interface ActivoFijoModalProps {
  activo: ActivoFijo | null;
  onClose: () => void;
}

export default function ActivoFijoModal({ activo, onClose }: ActivoFijoModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<ActivoFijoFormData>({
    resolver: zodResolver(activoFijoSchema),
    defaultValues: activo
      ? {
          nombre: activo.nombre,
          descripcion: activo.descripcion || '',
          categoria: activo.categoria,
          valorInicial: activo.valorInicial,
          fechaAdquisicion: activo.fechaAdquisicion,
          vidaUtilAnios: activo.vidaUtilAnios,
          valorResidual: activo.valorResidual || 0,
          proveedorId: activo.proveedorId,
          numeroFactura: activo.numeroFactura || '',
          ubicacion: activo.ubicacion || '',
          activo: activo.activo,
          notas: activo.notas || ''
        }
      : {
          activo: true,
          valorResidual: 0,
          vidaUtilAnios: 5
        }
  });

  // Calcular amortización estimada
  const valorInicial = watch('valorInicial') || 0;
  const valorResidual = watch('valorResidual') || 0;
  const vidaUtilAnios = watch('vidaUtilAnios') || 1;

  const amortizacionAnualEstimada = (valorInicial - valorResidual) / vidaUtilAnios;
  const amortizacionMensualEstimada = amortizacionAnualEstimada / 12;

  const mutation = useMutation({
    mutationFn: (data: ActivoFijoRequest) =>
      activo ? activosFijosApi.update(activo.id, data) : activosFijosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activos-fijos'] });
      queryClient.invalidateQueries({ queryKey: ['activos-valor-total'] });
      queryClient.invalidateQueries({ queryKey: ['activos-valor-neto'] });
      queryClient.invalidateQueries({ queryKey: ['activos-amortizacion'] });
      toast.success(activo ? 'Activo fijo actualizado correctamente' : 'Activo fijo creado correctamente');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar el activo fijo');
    }
  });

  const onSubmit = (data: ActivoFijoFormData) => {
    mutation.mutate(data);
  };

  useEffect(() => {
    if (activo) {
      reset({
        nombre: activo.nombre,
        descripcion: activo.descripcion || '',
        categoria: activo.categoria,
        valorInicial: activo.valorInicial,
        fechaAdquisicion: activo.fechaAdquisicion,
        vidaUtilAnios: activo.vidaUtilAnios,
        valorResidual: activo.valorResidual || 0,
        proveedorId: activo.proveedorId,
        numeroFactura: activo.numeroFactura || '',
        ubicacion: activo.ubicacion || '',
        activo: activo.activo,
        notas: activo.notas || ''
      });
    }
  }, [activo, reset]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {activo ? 'Editar Activo Fijo' : 'Nuevo Activo Fijo'}
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
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('nombre')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Sistema de iluminación LED"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-500">{errors.nombre.message}</p>
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
                  placeholder="Descripción detallada del activo"
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
                  {CATEGORIAS_ACTIVO_FIJO.map(cat => (
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
                  Ubicación
                </label>
                <input
                  type="text"
                  {...register('ubicacion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Sala principal"
                />
              </div>
            </div>
          </div>

          {/* Valores económicos */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Valores Económicos</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Inicial (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('valorInicial', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.valorInicial ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.valorInicial && (
                  <p className="mt-1 text-sm text-red-500">{errors.valorInicial.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Residual (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('valorResidual', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.valorResidual ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.valorResidual && (
                  <p className="mt-1 text-sm text-red-500">{errors.valorResidual.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Valor estimado al final de su vida útil
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Adquisición <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('fechaAdquisicion')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fechaAdquisicion ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fechaAdquisicion && (
                  <p className="mt-1 text-sm text-red-500">{errors.fechaAdquisicion.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vida Útil (años) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('vidaUtilAnios', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.vidaUtilAnios ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="5"
                />
                {errors.vidaUtilAnios && (
                  <p className="mt-1 text-sm text-red-500">{errors.vidaUtilAnios.message}</p>
                )}
              </div>
            </div>

            {/* Cálculo estimado */}
            {valorInicial > 0 && vidaUtilAnios > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  Amortización Estimada
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Amortización Anual:</p>
                    <p className="font-semibold text-blue-900">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(amortizacionAnualEstimada)}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Amortización Mensual:</p>
                    <p className="font-semibold text-blue-900">
                      {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(amortizacionMensualEstimada)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Información de compra */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Información de Compra (Opcional)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('activo')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Activo en uso
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                {...register('notas')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notas adicionales sobre el activo"
              />
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
              {mutation.isPending ? 'Guardando...' : activo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
