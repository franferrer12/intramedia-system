import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Transaccion, TransaccionFormData, TipoTransaccion, CategoriaTransaccion, Evento, Proveedor } from '../../types';
import { X } from 'lucide-react';
import { categoriasTransaccionApi } from '../../api/transacciones.api';
import { eventosApi } from '../../api/eventos.api';
import { proveedoresApi } from '../../api/proveedores.api';

interface TransaccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransaccionFormData) => Promise<void>;
  transaccion?: Transaccion;
}

export const TransaccionModal = ({ isOpen, onClose, onSubmit, transaccion }: TransaccionModalProps) => {
  const [formData, setFormData] = useState<TransaccionFormData>({
    tipo: 'GASTO',
    categoriaId: 0,
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    monto: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [categorias, setCategorias] = useState<CategoriaTransaccion[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transaccion) {
      setFormData({
        tipo: transaccion.tipo,
        categoriaId: transaccion.categoriaId,
        eventoId: transaccion.eventoId,
        fecha: transaccion.fecha,
        concepto: transaccion.concepto,
        descripcion: transaccion.descripcion,
        monto: transaccion.monto,
        metodoPago: transaccion.metodoPago,
        referencia: transaccion.referencia,
        proveedorId: transaccion.proveedorId,
        notas: transaccion.notas,
      });
    } else {
      setFormData({
        tipo: 'GASTO',
        categoriaId: 0,
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        monto: 0,
      });
    }
  }, [transaccion, isOpen]);

  useEffect(() => {
    if (formData.tipo) {
      loadCategoriasByTipo(formData.tipo);
    }
  }, [formData.tipo]);

  const loadData = async () => {
    try {
      const [eventosData, proveedoresData] = await Promise.all([
        eventosApi.getAll(),
        proveedoresApi.getActivos(),
      ]);
      setEventos(eventosData);
      setProveedores(proveedoresData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const loadCategoriasByTipo = async (tipo: TipoTransaccion) => {
    try {
      const categoriasData = await categoriasTransaccionApi.getByTipoActivas(tipo);
      setCategorias(categoriasData);
      // Si hay categorías, seleccionar la primera por defecto
      if (categoriasData.length > 0 && formData.categoriaId === 0) {
        setFormData(prev => ({ ...prev, categoriaId: categoriasData[0].id }));
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la transacción');
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
            {transaccion ? 'Editar Transacción' : 'Nueva Transacción'}
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
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoTransaccion, categoriaId: 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="INGRESO">Ingreso</option>
                <option value="GASTO">Gasto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría *
              </label>
              <select
                value={formData.categoriaId}
                onChange={(e) => setFormData({ ...formData, categoriaId: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value={0}>Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Fecha"
              value={formData.fecha}
              onChange={(value) => setFormData({ ...formData, fecha: value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto * (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <input
              type="text"
              value={formData.concepto}
              onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <select
                value={formData.metodoPago || ''}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar...</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia
              </label>
              <input
                type="text"
                value={formData.referencia || ''}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evento
              </label>
              <select
                value={formData.eventoId || ''}
                onChange={(e) => setFormData({ ...formData, eventoId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Sin evento</option>
                {eventos.map((evento) => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nombre} - {evento.fecha}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={formData.proveedorId || ''}
                onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Sin proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas || ''}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {transaccion ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
