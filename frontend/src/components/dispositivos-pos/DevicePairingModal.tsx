import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { X, QrCode, Link as LinkIcon, Hash, Copy, Check, Clock, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { dispositivosPosApi, PairingTokenResponse } from '../../api/dispositivos-pos.api';

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispositivoId: number;
  dispositivoNombre: string;
}

export const DevicePairingModal = ({
  isOpen,
  onClose,
  dispositivoId,
  dispositivoNombre,
}: DevicePairingModalProps) => {
  const [pairingData, setPairingData] = useState<PairingTokenResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'qr' | 'link' | 'code'>('qr');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (isOpen && dispositivoId) {
      generatePairingToken();
    } else {
      setPairingData(null);
      setError('');
    }
  }, [isOpen, dispositivoId]);

  // Countdown timer
  useEffect(() => {
    if (!pairingData) return;

    // Truncar nanosegundos (Java devuelve 9 dígitos, ISO solo acepta 6)
    // Formato backend: 2025-10-13T16:39:30.028705139
    // Formato ISO válido: 2025-10-13T16:39:30.028Z
    const truncatedTimestamp = pairingData.expiresAt.substring(0, 23) + 'Z';
    const expiresAt = new Date(truncatedTimestamp).getTime();

    // Validar que el parsing fue exitoso
    if (isNaN(expiresAt)) {
      console.error('Invalid date format:', pairingData.expiresAt);
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pairingData]);

  const generatePairingToken = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await dispositivosPosApi.generarTokenPairingNuevo(dispositivoId);
      setPairingData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar el token de vinculación');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareViaWhatsApp = () => {
    if (!pairingData) return;
    const message = `Vincula tu terminal POS "${dispositivoNombre}" usando este enlace: ${pairingData.directLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vincular Dispositivo POS</h2>
            <p className="text-sm text-gray-500 mt-1">{dispositivoNombre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {pairingData && !isLoading && (
            <>
              {/* Timer */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    Este código expira en: <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
                  </span>
                </div>
                {timeLeft === 0 && (
                  <Button size="sm" onClick={generatePairingToken}>
                    Generar Nuevo
                  </Button>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('qr')}
                    className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'qr'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Código QR
                  </button>
                  <button
                    onClick={() => setActiveTab('link')}
                    className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'link'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <LinkIcon className="w-5 h-5 mr-2" />
                    Enlace Directo
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center px-4 py-3 border-b-2 font-medium text-sm ${
                      activeTab === 'code'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Hash className="w-5 h-5 mr-2" />
                    Código Manual
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === 'qr' && (
                  <div className="flex flex-col items-center">
                    <p className="text-center text-gray-600 mb-6">
                      Escanea este código QR con el terminal POS para vincularlo automáticamente
                    </p>
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 shadow-sm">
                      <QRCodeSVG
                        value={pairingData.directLink}
                        size={256}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center max-w-md">
                      El terminal abrirá la página de vinculación automáticamente
                    </p>
                  </div>
                )}

                {activeTab === 'link' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Comparte este enlace con el terminal POS. Al abrirlo se vinculará automáticamente.
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={pairingData.directLink}
                        readOnly
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                      />
                      <Button
                        onClick={() => copyToClipboard(pairingData.directLink)}
                        variant="outline"
                        className="flex-shrink-0"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex space-x-3">
                      <Button
                        onClick={shareViaWhatsApp}
                        variant="outline"
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Compartir por WhatsApp
                      </Button>
                      <Button
                        onClick={() => window.open(pairingData.directLink, '_blank')}
                        variant="outline"
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir en Nueva Pestaña
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'code' && (
                  <div className="flex flex-col items-center">
                    <p className="text-center text-gray-600 mb-6">
                      Ingresa este código manualmente en el terminal POS
                    </p>
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-8">
                      <div className="text-6xl font-bold text-indigo-600 tracking-wider text-center font-mono">
                        {pairingData.pairingCode}
                      </div>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(pairingData.pairingCode)}
                      variant="outline"
                      className="mt-6"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Código Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Código
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-4 text-center max-w-md">
                      Este código debe ingresarse en la pantalla de vinculación del terminal
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
          {pairingData && timeLeft > 0 && (
            <Button onClick={generatePairingToken} variant="outline">
              Generar Nuevo Código
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
