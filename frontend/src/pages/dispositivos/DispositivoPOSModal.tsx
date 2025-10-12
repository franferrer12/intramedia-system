import { FC, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { dispositivosPosApi, DispositivoPOS, DispositivoPOSRequest } from '../../api/dispositivos-pos.api';
import { empleadosApi } from '../../api/empleados.api';

interface DispositivoPOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispositivo?: DispositivoPOS;
}

export const DispositivoPOSModal: FC<DispositivoPOSModalProps> = ({
  isOpen,
  onClose,
  dispositivo,
}) => {
  const queryClient = useQueryClient();
  const isEdit = !!dispositivo;

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<DispositivoPOSRequest>({
    defaultValues: dispositivo ? {
      nombre: dispositivo.nombre,
      descripcion: dispositivo.descripcion || '',
      tipo: dispositivo.tipo,
      ubicacion: dispositivo.ubicacion || '',
      empleadoAsignadoId: dispositivo.empleadoAsignadoId,
      pin: '', // No pre-llenamos el PIN por seguridad
      categoriasPredeterminadas: dispositivo.categoriasPredeterminadas || [],
      tieneLectorBarras: dispositivo.tieneLectorBarras || false,
      tieneCajonDinero: dispositivo.tieneCajonDinero || false,
      tienePantallaCliente: dispositivo.tienePantallaCliente || false,
      asignacionPermanente: dispositivo.asignacionPermanente || false,
    } : {
      tipo: 'MOVIL',
      tieneLectorBarras: false,
      tieneCajonDinero: false,
      tienePantallaCliente: false,
      asignacionPermanente: false,
    },
  });

  // Query para empleados
  const { data: empleados = [] } = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
  });

  // Mutation para crear/actualizar
  const mutation = useMutation({
    mutationFn: (data: DispositivoPOSRequest) => {
      if (isEdit) {
        return dispositivosPosApi.actualizar(dispositivo.id, data);
      }
      return dispositivosPosApi.registrar(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispositivos-pos'] });
      toast.success(isEdit ? 'Dispositivo actualizado' : 'Dispositivo registrado');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al guardar dispositivo');
    },
  });

  const onSubmit = (data: DispositivoPOSRequest) => {
    // Si no hay PIN en edición, creamos una copia sin el campo pin
    const dataToSubmit = { ...data };
    if (isEdit && !dataToSubmit.pin) {
      const { pin, ...rest } = dataToSubmit;
      mutation.mutate(rest as DispositivoPOSRequest);
    } else {
      mutation.mutate(dataToSubmit);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const tipo = watch('tipo');
  const asignacionPermanente = watch('asignacionPermanente');
  const empleadoAsignadoId = watch('empleadoAsignadoId');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Dispositivo POS' : 'Registrar Dispositivo POS'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Dispositivo *
              </label>
              <input
                {...register('nombre', { required: 'El nombre es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ej: Terminal Barra Principal"
              />
              {errors.nombre && (
                <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descripción opcional del dispositivo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Dispositivo *
                </label>
                <select
                  {...register('tipo', { required: 'El tipo es requerido' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MOVIL">Móvil (Camareros)</option>
                  <option value="BARRA">Barra (Tablet fija)</option>
                  <option value="CAJA">Caja (Terminal principal)</option>
                </select>
                {errors.tipo && (
                  <p className="text-red-600 text-sm mt-1">{errors.tipo.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación
                </label>
                <input
                  {...register('ubicacion')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ej: Barra Principal"
                />
              </div>
            </div>
          </div>

          {/* Asignación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Asignación</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado Asignado
              </label>
              <select
                {...register('empleadoAsignadoId', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin asignar</option>
                {Array.isArray(empleados) && empleados.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} {emp.apellido} - {emp.puesto}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {tipo === 'MOVIL'
                  ? 'Asigna este dispositivo móvil a un camarero/a específico'
                  : 'Opcional: empleado responsable de este dispositivo'
                }
              </p>
            </div>

            {/* Modo de Asignación */}
            {empleadoAsignadoId && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('asignacionPermanente')}
                    className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-amber-900">
                        🔒 Asignación Permanente (Fija)
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      {asignacionPermanente ? (
                        <>
                          <strong>Modo Activo:</strong> SOLO este empleado puede usar este dispositivo.
                          No se permite vinculación temporal (Quick Start).
                        </>
                      ) : (
                        <>
                          <strong>Quick Start:</strong> Cualquier empleado puede usar este dispositivo
                          escaneando su código. La asignación es temporal y se actualiza automáticamente.
                        </>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Seguridad */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIN de Acceso {!isEdit && '*'}
              </label>
              <input
                type="password"
                {...register('pin', {
                  required: !isEdit ? 'El PIN es requerido' : false,
                  minLength: { value: 4, message: 'El PIN debe tener al menos 4 dígitos' },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isEdit ? 'Dejar vacío para no cambiar' : '4 dígitos'}
                maxLength={6}
              />
              {errors.pin && (
                <p className="text-red-600 text-sm mt-1">{errors.pin.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {isEdit
                  ? 'Deja este campo vacío si no quieres cambiar el PIN actual'
                  : 'PIN numérico de 4-6 dígitos para acceder al terminal'
                }
              </p>
            </div>
          </div>

          {/* Hardware */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Hardware</h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('tieneLectorBarras')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Lector de códigos de barras</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('tieneCajonDinero')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Cajón de dinero</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('tienePantallaCliente')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Pantalla para cliente</span>
              </label>
            </div>
          </div>

          {/* Modo Operación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Modo de Operación</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('modoTabletCompartida')}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-semibold text-blue-900">Tablet Compartida</span>
                  <p className="text-xs text-blue-700 mt-1">
                    Activa esta opción si múltiples empleados usarán el mismo dispositivo.
                    Se les pedirá identificarse con su PIN antes de cada venta.
                  </p>
                </div>
              </label>
            </div>

            <p className="text-xs text-gray-500">
              {tipo === 'MOVIL'
                ? '💡 Para dispositivos móviles, normalmente cada empleado tiene su propio dispositivo (desactivar)'
                : '💡 Para tablets fijas en barra, recomendado activar el modo compartido'
              }
            </p>
          </div>

          {/* Instrucciones */}
          {!isEdit && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                ℹ️ Después de registrar el dispositivo
              </h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copia el UUID que aparecerá en la lista</li>
                <li>Abre el Terminal POS en el dispositivo físico</li>
                <li>Ingresa el UUID y el PIN para vincular</li>
                <li>El dispositivo quedará conectado y sincronizado</li>
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Registrar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
