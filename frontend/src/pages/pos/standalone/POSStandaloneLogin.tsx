import { FC, useState, useEffect } from 'react';
import { Shield, Delete, LogIn, Link } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';

interface POSStandaloneLoginProps {
  deviceUuid: string | null;
  onLogin: (uuid: string, pin: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  onSetDeviceUuid: (uuid: string) => void;
}

export const POSStandaloneLogin: FC<POSStandaloneLoginProps> = ({
  deviceUuid,
  onLogin,
  isLoading,
  error,
  onSetDeviceUuid,
}) => {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [uuid, setUuid] = useState(deviceUuid || '');
  const [showUuidInput, setShowUuidInput] = useState(!deviceUuid);

  useEffect(() => {
    if (deviceUuid) {
      setUuid(deviceUuid);
      setShowUuidInput(false);
    }
  }, [deviceUuid]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      return;
    }

    if (!uuid.trim()) {
      alert('Por favor ingresa el UUID del dispositivo');
      return;
    }

    const success = await onLogin(uuid, pin);
    if (success) {
      setPin('');
      onSetDeviceUuid(uuid);
    } else {
      setPin('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    } else if (e.key === 'Enter' && pin.length >= 4) {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-16 w-16 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Terminal POS</h1>
          <p className="text-gray-400">Ingresa tu PIN para continuar</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* UUID Input (si no está guardado) */}
          {showUuidInput && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UUID del Dispositivo
              </label>
              <input
                type="text"
                value={uuid}
                onChange={(e) => setUuid(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Solicita el UUID a tu administrador
              </p>
            </div>
          )}

          {showUuidInput && deviceUuid && (
            <div className="mb-4">
              <button
                onClick={() => {
                  setUuid(deviceUuid);
                  setShowUuidInput(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Usar UUID guardado: {deviceUuid.substring(0, 8)}...
              </button>
            </div>
          )}

          {/* PIN Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN de Seguridad
            </label>
            <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center gap-2 min-h-[60px]">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold ${
                    index < pin.length
                      ? 'bg-blue-500 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {index < pin.length ? '●' : ''}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4" onKeyDown={handleKeyDown}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isLoading}
                className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-bold text-gray-800 transition-colors disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="h-16 bg-red-100 hover:bg-red-200 active:bg-red-300 rounded-xl text-sm font-medium text-red-700 transition-colors disabled:opacity-50"
            >
              Limpiar
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              disabled={isLoading}
              className="h-16 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-2xl font-bold text-gray-800 transition-colors disabled:opacity-50"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="h-16 bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 rounded-xl flex items-center justify-center text-yellow-700 transition-colors disabled:opacity-50"
            >
              <Delete className="h-6 w-6" />
            </button>
          </div>

          {/* Login Button */}
          <Button
            onClick={handleSubmit}
            disabled={pin.length < 4 || isLoading || !uuid.trim()}
            variant="primary"
            className="w-full h-14 text-lg font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Verificando...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogIn className="h-5 w-5" />
                <span>Iniciar Sesión</span>
              </div>
            )}
          </Button>

          {/* Footer */}
          <div className="mt-6 space-y-3 text-center">
            <button
              onClick={() => setShowUuidInput(!showUuidInput)}
              className="text-sm text-gray-500 hover:text-gray-700 block w-full"
            >
              {showUuidInput ? 'Ocultar configuración' : '¿Cambiar dispositivo?'}
            </button>

            {/* Vincular Dispositivo Button */}
            <div className="pt-3 border-t border-gray-200">
              <Button
                onClick={() => navigate('/pos-terminal/pair')}
                variant="outline"
                className="w-full"
                disabled={isLoading}
              >
                <Link className="h-4 w-4 mr-2" />
                Vincular Nuevo Dispositivo
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Primera vez o código de vinculación
              </p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Club Management System v0.7.0
          </p>
          {uuid && !showUuidInput && (
            <p className="text-xs text-gray-500 mt-1">
              Dispositivo: {uuid.substring(0, 13)}...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
