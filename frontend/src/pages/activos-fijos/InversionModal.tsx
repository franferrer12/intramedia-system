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
        <div className="flex items-center justify-between p-6 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {inversion ? '✏️ Editar Inversión' : '➕ Registrar Inversión'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {inversion ? 'Modifica los datos de esta inversión' : 'Anota un gasto que hiciste para abrir el club'}
            </p>
          </div>
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
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📝 ¿Qué compraste o pagaste?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Qué fue? <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('concepto')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                    errors.concepto ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Reforma del local, Mesas y sillas, Sistema de sonido..."
                />
                {errors.concepto && (
                  <p className="mt-1 text-sm text-red-500">{errors.concepto.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="Ej: 10 mesas de madera y 40 sillas negras"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿De qué tipo es? <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('categoria')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base ${
                    errors.categoria ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Elegir tipo de gasto...</option>
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Cómo pagaste?
                </label>
                <select
                  {...register('formaPago')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                >
                  <option value="">Forma de pago...</option>
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
          <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              💰 ¿Cuánto costó?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Precio total en € <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('monto', { valueAsNumber: true })}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base font-semibold ${
                    errors.monto ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1500.00"
                />
                {errors.monto && (
                  <p className="mt-1 text-sm text-red-500">{errors.monto.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Cuándo lo compré? <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register('fecha')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base ${
                    errors.fecha ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha && (
                  <p className="mt-1 text-sm text-red-500">{errors.fecha.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de factura (opcional)
                </label>
                <input
                  type="text"
                  {...register('numeroFactura')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base"
                  placeholder="Ej: FAC-2024-001"
                />
                <p className="text-xs text-gray-500 mt-1">Si tienes la factura, anota el número aquí</p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition text-base"
            >
              ❌ Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:from-blue-400 disabled:to-blue-400 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {mutation.isPending ? '⏳ Guardando...' : inversion ? '✅ Guardar Cambios' : '✅ Registrar Inversión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
