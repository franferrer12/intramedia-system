import { FC } from 'react';
import { User, X } from 'lucide-react';

interface Empleado {
  id: number;
  nombre: string;
  apellido: string;
  iniciales: string;
  puesto?: string;
  activo?: boolean;
}

interface EmpleadoQuickSelectProps {
  isOpen: boolean;
  empleados: Empleado[];
  onSelect: (empleadoId: number, empleadoNombre: string) => void;
  onCancel: () => void;
}

export const EmpleadoQuickSelect: FC<EmpleadoQuickSelectProps> = ({
  isOpen,
  empleados,
  onSelect,
  onCancel,
}) => {
  const handleEmpleadoClick = (empleado: Empleado) => {
    // Selección directa sin PIN - ir directo al pago
    onSelect(empleado.id, `${empleado.nombre} ${empleado.apellido}`);
  };

  if (!isOpen) return null;

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Selecciona tu Usuario</h2>
              <p className="text-sm text-blue-100">Toca tu nombre para continuar</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Lista de empleados */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {empleados.map((empleado, index) => {
              const colorClass = colors[index % colors.length];
              const iniciales = empleado.iniciales ||
                (empleado.nombre?.charAt(0) || '') + (empleado.apellido?.charAt(0) || '');

              return (
                <button
                  key={empleado.id}
                  onClick={() => handleEmpleadoClick(empleado)}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  <div className={`w-20 h-20 ${colorClass} rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {iniciales}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">
                      {empleado.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      {empleado.apellido}
                    </p>
                    {empleado.puesto && (
                      <p className="text-xs text-gray-500 mt-1">
                        {empleado.puesto}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
