import { FC, useState, useEffect } from 'react';
import { User, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

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
  const [pinInput, setPinInput] = useState('');
  const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null);
  const [showPinMode, setShowPinMode] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPinInput('');
      setSelectedEmpleado(null);
      setShowPinMode(false);
    }
  }, [isOpen]);

  const handleEmpleadoClick = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    setShowPinMode(true);
  };

  const handlePinKeyPress = (digit: string) => {
    if (digit === 'backspace') {
      setPinInput(prev => prev.slice(0, -1));
    } else if (digit === 'clear') {
      setPinInput('');
    } else if (pinInput.length < 4) {
      setPinInput(prev => prev + digit);
    }
  };

  const handleConfirm = () => {
    if (selectedEmpleado && pinInput.length === 4) {
      onSelect(selectedEmpleado.id, `${selectedEmpleado.nombre} ${selectedEmpleado.apellido}`);
      setPinInput('');
      setSelectedEmpleado(null);
      setShowPinMode(false);
    }
  };

  const handleBack = () => {
    setShowPinMode(false);
    setPinInput('');
    setSelectedEmpleado(null);
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
              <h2 className="text-xl font-bold">
                {showPinMode ? 'Confirmar Identidad' : 'Selecciona tu Usuario'}
              </h2>
              <p className="text-sm text-blue-100">
                {showPinMode
                  ? `Ingresa tu PIN de 4 dígitos, ${selectedEmpleado?.nombre}`
                  : 'Toca tu nombre para registrar la venta'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showPinMode ? (
            // Lista de empleados
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {empleados.map((empleado, index) => {
                const colorClass = colors[index % colors.length];
                const iniciales = empleado.iniciales ||
                  (empleado.nombre?.charAt(0) || '') + (empleado.apellido?.charAt(0) || '');

                return (
                  <button
                    key={empleado.id}
                    onClick={() => handleEmpleadoClick(empleado)}
                    className="flex flex-col items-center gap-3 p-6 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all hover:scale-105 hover:shadow-lg"
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
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // PIN pad
            <div className="space-y-6">
              {/* Avatar y nombre del empleado seleccionado */}
              <div className="flex flex-col items-center gap-3">
                <div className={`w-24 h-24 ${colors[empleados.indexOf(selectedEmpleado!) % colors.length]} rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                  {selectedEmpleado?.iniciales || ((selectedEmpleado?.nombre?.charAt(0) || '') + (selectedEmpleado?.apellido?.charAt(0) || ''))}
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900">
                    {selectedEmpleado?.nombre} {selectedEmpleado?.apellido}
                  </p>
                  <p className="text-sm text-gray-600">Ingresa tu PIN</p>
                </div>
              </div>

              {/* PIN display */}
              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                      pinInput.length > index
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 bg-white text-gray-300'
                    }`}
                  >
                    {pinInput.length > index ? '●' : ''}
                  </div>
                ))}
              </div>

              {/* Numeric keypad */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handlePinKeyPress(digit.toString())}
                    className="h-16 bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold text-gray-900 transition-colors shadow-sm hover:shadow-md active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  onClick={() => handlePinKeyPress('clear')}
                  className="h-16 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold text-red-700 transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => handlePinKeyPress('0')}
                  className="h-16 bg-gray-100 hover:bg-gray-200 rounded-lg text-2xl font-bold text-gray-900 transition-colors shadow-sm hover:shadow-md active:scale-95"
                >
                  0
                </button>
                <button
                  onClick={() => handlePinKeyPress('backspace')}
                  className="h-16 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
                >
                  ←
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Volver
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={pinInput.length !== 4}
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
