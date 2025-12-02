import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from '../utils/toast';
import {
  createEquipment,
  updateEquipment,
  getEquipmentTypes,
  getEquipmentStatus
} from '../services/equipmentService';

/**
 * Equipment Form Modal Component
 * Form for creating and editing equipment
 */
const EquipmentForm = ({ isOpen, equipment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tipo: '',
    marca: '',
    modelo: '',
    cantidad: 1,
    precio_compra: '',
    precio_alquiler_dia: '',
    precio_alquiler_evento: '',
    estado: 'disponible',
    descripcion: '',
    foto_url: '',
    numero_serie: '',
    fecha_compra: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (equipment) {
      setFormData({
        tipo: equipment.tipo || '',
        marca: equipment.marca || '',
        modelo: equipment.modelo || '',
        cantidad: equipment.cantidad || 1,
        precio_compra: equipment.precio_compra || '',
        precio_alquiler_dia: equipment.precio_alquiler_dia || '',
        precio_alquiler_evento: equipment.precio_alquiler_evento || '',
        estado: equipment.estado || 'disponible',
        descripcion: equipment.descripcion || '',
        foto_url: equipment.foto_url || '',
        numero_serie: equipment.numero_serie || '',
        fecha_compra: equipment.fecha_compra || ''
      });
    } else {
      // Reset form for new equipment
      setFormData({
        tipo: '',
        marca: '',
        modelo: '',
        cantidad: 1,
        precio_compra: '',
        precio_alquiler_dia: '',
        precio_alquiler_evento: '',
        estado: 'disponible',
        descripcion: '',
        foto_url: '',
        numero_serie: '',
        fecha_compra: ''
      });
    }
  }, [equipment, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.tipo || !formData.marca || !formData.modelo) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    try {
      setLoading(true);

      // Convert string numbers to actual numbers
      const dataToSend = {
        ...formData,
        cantidad: parseInt(formData.cantidad) || 1,
        precio_compra: formData.precio_compra ? parseFloat(formData.precio_compra) : null,
        precio_alquiler_dia: formData.precio_alquiler_dia ? parseFloat(formData.precio_alquiler_dia) : null,
        precio_alquiler_evento: formData.precio_alquiler_evento ? parseFloat(formData.precio_alquiler_evento) : null
      };

      if (equipment) {
        await updateEquipment(equipment.id, dataToSend);
        toast.success('Equipo actualizado exitosamente');
      } else {
        await createEquipment(dataToSend);
        toast.success('Equipo creado exitosamente');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast.error(error.response?.data?.message || 'Error al guardar equipo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {equipment ? 'Editar Equipo' : 'Nuevo Equipo'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Equipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona un tipo</option>
                    {getEquipmentTypes().map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getEquipmentStatus().map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marca <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="marca"
                    value={formData.marca}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Pioneer, JBL, Shure"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Modelo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="modelo"
                    value={formData.modelo}
                    onChange={handleChange}
                    required
                    placeholder="Ej: CDJ-2000NXS2, EON615"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    min="1"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Número de Serie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Serie
                  </label>
                  <input
                    type="text"
                    name="numero_serie"
                    value={formData.numero_serie}
                    onChange={handleChange}
                    placeholder="S/N opcional"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Precio de Compra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio de Compra
                  </label>
                  <input
                    type="number"
                    name="precio_compra"
                    value={formData.precio_compra}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Fecha de Compra */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Compra
                  </label>
                  <input
                    type="date"
                    name="fecha_compra"
                    value={formData.fecha_compra}
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Precio Alquiler por Día */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio Alquiler por Día
                  </label>
                  <input
                    type="number"
                    name="precio_alquiler_dia"
                    value={formData.precio_alquiler_dia}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Precio Alquiler por Evento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio Alquiler por Evento
                  </label>
                  <input
                    type="number"
                    name="precio_alquiler_evento"
                    value={formData.precio_alquiler_evento}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* URL de Foto */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL de Foto
                  </label>
                  <input
                    type="url"
                    name="foto_url"
                    value={formData.foto_url}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/foto.jpg"
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Descripción */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Descripción opcional del equipo..."
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : (equipment ? 'Actualizar' : 'Crear Equipo')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EquipmentForm;
