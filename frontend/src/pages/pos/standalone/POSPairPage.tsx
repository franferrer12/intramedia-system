import { FC, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode, Hash, CheckCircle, AlertCircle, Loader2, Link as LinkIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { dispositivosPosApi } from '../../../api/dispositivos-pos.api';

export const POSPairPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'code' | 'qr'>('code');
  const [pairingCode, setPairingCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auto-pairing si viene pairing key en la URL (parámetro 'p')
  useEffect(() => {
    const pairingKey = searchParams.get('p');
    if (pairingKey) {
      autoPairWithToken(pairingKey);
    }
  }, [searchParams]);

  const autoPairWithToken = async (token: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await dispositivosPosApi.vincularPorToken(token);

      // Guardar deviceToken y deviceUUID en localStorage
      localStorage.setItem('deviceToken', response.deviceToken);
      localStorage.setItem('deviceUUID', response.deviceUUID);
      localStorage.setItem('deviceInfo', JSON.stringify(response.device));

      setSuccess(true);

      // Redirigir al login POS después de 2 segundos
      setTimeout(() => {
        navigate('/pos-standalone');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token inválido o expirado. Por favor solicita uno nuevo.');
      setIsLoading(false);
    }
  };

  const handleCodePairing = async () => {
    if (!pairingCode.trim()) {
      setError('Por favor ingresa el código de vinculación');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await dispositivosPosApi.vincularPorCodigo(pairingCode);

      // Guardar deviceToken y deviceUUID en localStorage
      localStorage.setItem('deviceToken', response.deviceToken);
      localStorage.setItem('deviceUUID', response.deviceUUID);
      localStorage.setItem('deviceInfo', JSON.stringify(response.device));

      setSuccess(true);

      // Redirigir al login POS después de 2 segundos
      setTimeout(() => {
        navigate('/pos-standalone');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido o expirado. Por favor verifica e intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Solo permitir números y guión
    const value = e.target.value.replace(/[^0-9-]/g, '');
    setPairingCode(value);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <CheckCircle className="h-24 w-24 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Vinculación Exitosa!
          </h1>
          <p className="text-gray-600 mb-6">
            El terminal POS ha sido vinculado correctamente. Redirigiendo al login...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <LinkIcon className="h-16 w-16 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Vincular Terminal POS</h1>
          <p className="text-gray-400">Conecta este dispositivo con el sistema</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Method Selector */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setMethod('code')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                method === 'code'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Hash className="h-5 w-5" />
                <span>Código Manual</span>
              </div>
            </button>
            <button
              onClick={() => setMethod('qr')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                method === 'qr'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <QrCode className="h-5 w-5" />
                <span>Escanear QR</span>
              </div>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error de Vinculación</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Code Method */}
          {method === 'code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Vinculación
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={pairingCode}
                  onChange={handleCodeInputChange}
                  placeholder="123-456"
                  maxLength={7}
                  className="flex-1 px-4 py-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-wider"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ingresa el código de 6 dígitos proporcionado por el administrador
              </p>

              <Button
                onClick={handleCodePairing}
                disabled={!pairingCode.trim() || isLoading}
                variant="primary"
                className="w-full h-14 text-lg font-semibold mt-6"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Vinculando...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    <span>Vincular Terminal</span>
                  </div>
                )}
              </Button>
            </div>
          )}

          {/* QR Method */}
          {method === 'qr' && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-6">
                <QrCode className="h-32 w-32 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Escanear Código QR
              </h3>
              <p className="text-gray-600 mb-6">
                Usa la cámara de tu dispositivo para escanear el código QR mostrado en el backoffice
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> La funcionalidad de escaneo QR requiere acceso a la cámara.
                  Si prefieres, puedes usar el código manual.
                </p>
              </div>
              <Button
                onClick={() => setMethod('code')}
                variant="outline"
                className="mt-6"
              >
                Usar Código Manual
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Club Management System v0.7.0
          </p>
          <p className="text-xs text-gray-500 mt-2">
            ¿No tienes un código? Contacta a tu administrador
          </p>
        </div>
      </div>
    </div>
  );
};
