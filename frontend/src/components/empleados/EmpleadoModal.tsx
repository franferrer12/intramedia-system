import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Empleado, EmpleadoFormData } from '../../types';
import { X } from 'lucide-react';

interface EmpleadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmpleadoFormData) => Promise<void>;
  empleado?: Empleado;
}

export const EmpleadoModal = ({ isOpen, onClose, onSubmit, empleado }: EmpleadoModalProps) => {
  const [formData, setFormData] = useState<EmpleadoFormData>({
    nombre: '',
    apellidos: '',
    dni: '',
    cargo: '',
    fechaAlta: new Date().toISOString().split('T')[0],
    salarioBase: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (empleado) {
      setFormData({
        nombre: empleado.nombre,
        apellidos: empleado.apellidos,
        dni: empleado.dni,
        email: empleado.email,
        telefono: empleado.telefono,
        direccion: empleado.direccion,
        cargo: empleado.cargo,
        departamento: empleado.departamento,
        fechaAlta: empleado.fechaAlta,
        fechaBaja: empleado.fechaBaja,
        salarioBase: empleado.salarioBase,
        tipoContrato: empleado.tipoContrato,
        numSeguridadSocial: empleado.numSeguridadSocial,
        cuentaBancaria: empleado.cuentaBancaria,
        notas: empleado.notas,
      });
    } else {
      setFormData({
        nombre: '',
        apellidos: '',
        dni: '',
        cargo: '',
        fechaAlta: new Date().toISOString().split('T')[0],
        salarioBase: 0,
      });
    }
  }, [empleado, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar el empleado');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {empleado ? 'Editar Empleado' : 'Nuevo Empleado'}
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
                Nombre *
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellidos *
              </label>
              <input
                type="text"
                value={formData.apellidos}
                onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                DNI *
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
                maxLength={9}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefono
              </label>
              <input
                type="tel"
                value={formData.telefono || ''}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Direccion
              </label>
              <input
                type="text"
                value={formData.direccion || ''}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cargo *
              </label>
              <input
                type="text"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <input
                type="text"
                value={formData.departamento || ''}
                onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Fecha de Alta"
              value={formData.fechaAlta}
              onChange={(value) => setFormData({ ...formData, fechaAlta: value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salario Base * (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.salarioBase}
                onChange={(e) => setFormData({ ...formData, salarioBase: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Contrato
              </label>
              <select
                value={formData.tipoContrato || ''}
                onChange={(e) => setFormData({ ...formData, tipoContrato: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar...</option>
                <option value="Indefinido">Indefinido</option>
                <option value="Temporal">Temporal</option>
                <option value="Practicas">Practicas</option>
                <option value="Formacion">Formacion</option>
                <option value="Obra y Servicio">Obra y Servicio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero de Seguridad Social
              </label>
              <input
                type="text"
                value={formData.numSeguridadSocial || ''}
                onChange={(e) => setFormData({ ...formData, numSeguridadSocial: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuenta Bancaria (IBAN)
            </label>
            <input
              type="text"
              value={formData.cuentaBancaria || ''}
              onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="ES00 0000 0000 0000 0000 0000"
            />
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
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {empleado ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
