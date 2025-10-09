import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Nomina, NominaFormData, Empleado, EstadoNomina } from '../../types';
import { X } from 'lucide-react';
import { empleadosApi } from '../../api/empleados.api';

interface NominaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NominaFormData) => Promise<void>;
  nomina?: Nomina;
}

export const NominaModal = ({ isOpen, onClose, onSubmit, nomina }: NominaModalProps) => {
  const getCurrentPeriodo = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState<NominaFormData>({
    empleadoId: 0,
    periodo: getCurrentPeriodo(),
    fechaPago: new Date().toISOString().split('T')[0],
    salarioBase: 0,
    horasExtra: 0,
    precioHoraExtra: 0,
    bonificaciones: 0,
    deducciones: 0,
    otrasRetenciones: 0,
    estado: 'PENDIENTE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadEmpleados();
    }
  }, [isOpen]);

  useEffect(() => {
    if (nomina) {
      setFormData({
        empleadoId: nomina.empleadoId,
        periodo: nomina.periodo,
        fechaPago: nomina.fechaPago,
        salarioBase: nomina.salarioBase,
        horasExtra: nomina.horasExtra,
        precioHoraExtra: nomina.precioHoraExtra,
        bonificaciones: nomina.bonificaciones,
        deducciones: nomina.deducciones,
        otrasRetenciones: nomina.otrasRetenciones,
        estado: nomina.estado,
        metodoPago: nomina.metodoPago,
        referenciaPago: nomina.referenciaPago,
        notas: nomina.notas,
      });
    } else {
      setFormData({
        empleadoId: 0,
        periodo: getCurrentPeriodo(),
        fechaPago: new Date().toISOString().split('T')[0],
        salarioBase: 0,
        horasExtra: 0,
        precioHoraExtra: 0,
        bonificaciones: 0,
        deducciones: 0,
        otrasRetenciones: 0,
        estado: 'PENDIENTE',
      });
    }
  }, [nomina, isOpen]);

  useEffect(() => {
    // Auto-cargar salario base cuando se selecciona un empleado
    if (formData.empleadoId && !nomina) {
      const empleado = empleados.find(e => e.id === formData.empleadoId);
      if (empleado) {
        setFormData(prev => ({ ...prev, salarioBase: empleado.salarioBase }));
      }
    }
  }, [formData.empleadoId, empleados, nomina]);

  const loadEmpleados = async () => {
    try {
      const data = await empleadosApi.getActivos();
      setEmpleados(data);
    } catch (err) {
      console.error('Error loading empleados:', err);
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

    if (formData.salarioBase <= 0) {
      setError('El salario base debe ser mayor a 0');
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la nómina');
    } finally {
      setIsLoading(false);
    }
  };

  const calcularSalarioBruto = () => {
    const horasExtraTotal = (formData.horasExtra || 0) * (formData.precioHoraExtra || 0);
    return formData.salarioBase + horasExtraTotal + (formData.bonificaciones || 0);
  };

  const calcularRetenciones = () => {
    const salarioBruto = calcularSalarioBruto();
    // Cálculo simplificado: 6.35% de Seguridad Social y 15% de IRPF aproximado
    const seguridadSocial = salarioBruto * 0.0635;
    const irpf = salarioBruto * 0.15;
    return {
      seguridadSocial,
      irpf,
      total: seguridadSocial + irpf + (formData.deducciones || 0) + (formData.otrasRetenciones || 0)
    };
  };

  const calcularSalarioNeto = () => {
    const salarioBruto = calcularSalarioBruto();
    const retenciones = calcularRetenciones();
    return salarioBruto - retenciones.total;
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(monto);
  };

  if (!isOpen) return null;

  const salarioBruto = calcularSalarioBruto();
  const retenciones = calcularRetenciones();
  const salarioNeto = calcularSalarioNeto();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {nomina ? 'Editar Nomina' : 'Nueva Nomina'}
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
                disabled={!!nomina}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodo * (YYYY-MM)
              </label>
              <input
                type="month"
                value={formData.periodo}
                onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <DatePicker
                label="Fecha de Pago"
                value={formData.fechaPago}
                onChange={(value) => setFormData({ ...formData, fechaPago: value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado *
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as EstadoNomina })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="PAGADA">Pagada</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Conceptos Salariales</h3>

            <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bonificaciones (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.bonificaciones}
                  onChange={(e) => setFormData({ ...formData, bonificaciones: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas Extra
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.horasExtra}
                  onChange={(e) => setFormData({ ...formData, horasExtra: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Hora Extra (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precioHoraExtra}
                  onChange={(e) => setFormData({ ...formData, precioHoraExtra: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Horas Extra
                </label>
                <input
                  type="text"
                  value={formatMonto((formData.horasExtra || 0) * (formData.precioHoraExtra || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Deducciones y Retenciones</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deducciones (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deducciones}
                  onChange={(e) => setFormData({ ...formData, deducciones: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Otras Retenciones (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.otrasRetenciones}
                  onChange={(e) => setFormData({ ...formData, otrasRetenciones: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumen de Nomina</h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Salario Bruto:</span>
                <span className="font-semibold text-gray-900">{formatMonto(salarioBruto)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Seguridad Social (6.35%):</span>
                <span className="font-semibold text-red-600">-{formatMonto(retenciones.seguridadSocial)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">IRPF (15%):</span>
                <span className="font-semibold text-red-600">-{formatMonto(retenciones.irpf)}</span>
              </div>
              {(formData.deducciones || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deducciones:</span>
                  <span className="font-semibold text-red-600">-{formatMonto(formData.deducciones || 0)}</span>
                </div>
              )}
              {(formData.otrasRetenciones || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Otras Retenciones:</span>
                  <span className="font-semibold text-red-600">-{formatMonto(formData.otrasRetenciones || 0)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold text-gray-900">Salario Neto:</span>
                <span className="font-bold text-green-600 text-lg">{formatMonto(salarioNeto)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Metodo de Pago
              </label>
              <select
                value={formData.metodoPago || ''}
                onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Seleccionar...</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referencia de Pago
              </label>
              <input
                type="text"
                value={formData.referenciaPago || ''}
                onChange={(e) => setFormData({ ...formData, referenciaPago: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Numero de transaccion, cheque, etc."
              />
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
              rows={3}
              placeholder="Observaciones adicionales sobre esta nomina..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {nomina ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
