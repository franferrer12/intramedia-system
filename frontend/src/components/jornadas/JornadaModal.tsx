import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { JornadaTrabajo, JornadaTrabajoFormData, Empleado, Evento } from '../../types';
import { X } from 'lucide-react';
import { empleadosApi } from '../../api/empleados.api';
import { eventosApi } from '../../api/eventos.api';

interface JornadaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JornadaTrabajoFormData) => Promise<void>;
  jornada?: JornadaTrabajo;
}

export const JornadaModal = ({ isOpen, onClose, onSubmit, jornada }: JornadaModalProps) => {
  const [formData, setFormData] = useState<JornadaTrabajoFormData>({
    empleadoId: 0,
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '22:00',
    horaFin: '06:00',
    metodoPago: 'EFECTIVO',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadEmpleados();
      loadEventos();
    }
  }, [isOpen]);

  useEffect(() => {
    if (jornada) {
      setFormData({
        empleadoId: jornada.empleadoId,
        fecha: jornada.fecha,
        horaInicio: jornada.horaInicio,
        horaFin: jornada.horaFin,
        precioHora: jornada.precioHora,
        eventoId: jornada.eventoId,
        metodoPago: jornada.metodoPago || 'EFECTIVO',
        notas: jornada.notas,
      });
    } else {
      setFormData({
        empleadoId: 0,
        fecha: new Date().toISOString().split('T')[0],
        horaInicio: '22:00',
        horaFin: '06:00',
        metodoPago: 'EFECTIVO',
      });
    }
  }, [jornada, isOpen]);

  useEffect(() => {
    // Auto-cargar precio/hora cuando se selecciona un empleado
    if (formData.empleadoId && !jornada && !formData.precioHora) {
      const empleado = empleados.find(e => e.id === formData.empleadoId);
      if (empleado && empleado.salarioBase) {
        // Calcular precio por hora aproximado (salario mensual / 160 horas)
        const precioHoraEstimado = Math.round((empleado.salarioBase / 160) * 100) / 100;
        setFormData(prev => ({ ...prev, precioHora: precioHoraEstimado }));
      }
    }
  }, [formData.empleadoId, empleados, jornada, formData.precioHora]);

  const loadEmpleados = async () => {
    try {
      const data = await empleadosApi.getActivos();
      setEmpleados(data);
    } catch (err) {
      console.error('Error loading empleados:', err);
    }
  };

  const loadEventos = async () => {
    try {
      const data = await eventosApi.getAll();
      setEventos(data);
    } catch (err) {
      console.error('Error loading eventos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.empleadoId === 0) {
      setError('Debe seleccionar un empleado');
      return;
    }

    if (!formData.horaInicio || !formData.horaFin) {
      setError('Debe especificar hora de inicio y fin');
      return;
    }

    if (!formData.precioHora || formData.precioHora <= 0) {
      setError('El precio por hora debe ser mayor a 0');
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la jornada');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularHorasTrabajadas = () => {
    if (!formData.horaInicio || !formData.horaFin) return 0;

    const [horaIni, minIni] = formData.horaInicio.split(':').map(Number);
    const [horaFin, minFin] = formData.horaFin.split(':').map(Number);

    let minutosInicio = horaIni * 60 + minIni;
    let minutosFin = horaFin * 60 + minFin;

    // Si horaFin < horaInicio, significa que cruza medianoche
    if (minutosFin < minutosInicio) {
      minutosFin += 24 * 60; // Agregar 24 horas
    }

    const minutosTrabajados = minutosFin - minutosInicio;
    return Math.round((minutosTrabajados / 60) * 100) / 100;
  };

  const calcularTotalPagar = () => {
    const horas = calcularHorasTrabajadas();
    const precio = formData.precioHora || 0;
    return Math.round(horas * precio * 100) / 100;
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(monto);
  };

  if (!isOpen) return null;

  const horasTrabajadas = calcularHorasTrabajadas();
  const totalPagar = calcularTotalPagar();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {jornada ? 'Editar Jornada' : 'Nueva Jornada'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado *
              </label>
              <select
                value={formData.empleadoId}
                onChange={(e) => setFormData({ ...formData, empleadoId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                disabled={!!jornada}
              >
                <option value={0}>Seleccionar empleado</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre} {empleado.apellidos} - {empleado.cargo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <DatePicker
                label="Fecha"
                value={formData.fecha}
                onChange={(value) => setFormData({ ...formData, fecha: value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Inicio * (HH:mm)
              </label>
              <input
                type="time"
                value={formData.horaInicio}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Fin * (HH:mm)
              </label>
              <input
                type="time"
                value={formData.horaFin}
                onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio/Hora * (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precioHora || ''}
                onChange={(e) => setFormData({ ...formData, precioHora: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                placeholder="Se auto-completa con el salario del empleado"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metodo de Pago *
              </label>
              <select
                value={formData.metodoPago}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evento (Opcional)
            </label>
            <select
              value={formData.eventoId || ''}
              onChange={(e) => setFormData({ ...formData, eventoId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Sin evento asociado</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nombre} - {new Date(evento.fecha).toLocaleDateString('es-ES')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas || ''}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Observaciones adicionales sobre esta jornada..."
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Calculo Automatico</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Horas Trabajadas:</span>
                <span className="font-semibold text-gray-900">{horasTrabajadas.toFixed(2)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio por Hora:</span>
                <span className="font-semibold text-gray-900">{formatMonto(formData.precioHora || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Total a Pagar:</span>
                <span className="font-bold text-green-600 text-lg">{formatMonto(totalPagar)}</span>
              </div>
              {horasTrabajadas > 0 && formData.horaFin < formData.horaInicio && (
                <div className="text-xs text-blue-600 mt-2">
                  * La jornada cruza medianoche (turno nocturno)
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {jornada ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
