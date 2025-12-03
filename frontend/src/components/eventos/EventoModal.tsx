import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Evento, EventoFormData, TipoEvento, EstadoEvento } from '../../types';
import { X } from 'lucide-react';

interface EventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventoFormData) => Promise<void>;
  evento?: Evento;
  initialData?: Partial<EventoFormData>;
}

export const EventoModal = ({ isOpen, onClose, onSubmit, evento, initialData }: EventoModalProps) => {
  const [formData, setFormData] = useState<EventoFormData>({
    nombre: '',
    fecha: '',
    tipo: 'REGULAR',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (evento) {
      // Modo edición: cargar datos del evento existente
      setFormData({
        nombre: evento.nombre,
        fecha: evento.fecha,
        horaInicio: evento.horaInicio,
        horaFin: evento.horaFin,
        tipo: evento.tipo,
        aforoEsperado: evento.aforoEsperado,
        aforoReal: evento.aforoReal,
        estado: evento.estado,
        precioEntrada: evento.precioEntrada,
        artista: evento.artista,
        cacheArtista: evento.cacheArtista,
        ingresosEstimados: evento.ingresosEstimados,
        gastosEstimados: evento.gastosEstimados,
        ingresosReales: evento.ingresosReales,
        gastosReales: evento.gastosReales,
        descripcion: evento.descripcion,
        notas: evento.notas,
      });
    } else if (initialData) {
      // Modo creación con datos iniciales (plantilla o duplicado)
      setFormData({
        nombre: '',
        fecha: '',
        tipo: 'REGULAR',
        ...initialData,
      });
    } else {
      // Modo creación vacío
      setFormData({
        nombre: '',
        fecha: '',
        tipo: 'REGULAR',
      });
    }
  }, [evento, initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el evento');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {evento ? 'Editar Evento' : 'Nuevo Evento'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <DatePicker
                label="Fecha"
                value={formData.fecha}
                onChange={(value) => setFormData({ ...formData, fecha: value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Evento *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoEvento })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="REGULAR">Regular</option>
                <option value="ESPECIAL">Especial</option>
                <option value="CONCIERTO">Concierto</option>
                <option value="PRIVADO">Privado</option>
                <option value="TEMATICO">Temático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Inicio
              </label>
              <input
                type="time"
                value={formData.horaInicio || ''}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Fin
              </label>
              <input
                type="time"
                value={formData.horaFin || ''}
                onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {evento && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado || 'PLANIFICADO'}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoEvento })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="PLANIFICADO">Planificado</option>
                  <option value="CONFIRMADO">Confirmado</option>
                  <option value="EN_CURSO">En Curso</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aforo Esperado
              </label>
              <input
                type="number"
                value={formData.aforoEsperado || ''}
                onChange={(e) => setFormData({ ...formData, aforoEsperado: parseInt(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio Entrada (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.precioEntrada || ''}
                onChange={(e) => setFormData({ ...formData, precioEntrada: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artista
              </label>
              <input
                type="text"
                value={formData.artista || ''}
                onChange={(e) => setFormData({ ...formData, artista: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion || ''}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {evento ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
