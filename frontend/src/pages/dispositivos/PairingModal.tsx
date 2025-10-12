import { FC, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, QrCode, Link as LinkIcon, User, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button';
import { dispositivosPosApi, DispositivoPOS } from '../../api/dispositivos-pos.api';
import { QRCodeSVG } from 'qrcode.react';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispositivo: DispositivoPOS;
}

export const PairingModal: FC<PairingModalProps> = ({
  isOpen,
  onClose,
  dispositivo,
}) => {
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [pairingUrl, setPairingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Mutation para generar token de pairing
  const generarTokenMutation = useMutation({
    mutationFn: () => dispositivosPosApi.generarTokenPairing(dispositivo.id),
    onSuccess: (data) => {
      setPairingToken(data.pairingToken);
      setPairingUrl(data.pairingUrl);
      toast.success('Token de emparejamiento generado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al generar token');
    },
  });

  // Generar token cuando se abre el modal
  useEffect(() => {
    if (isOpen && !pairingToken) {
      generarTokenMutation.mutate();
    }
  }, [isOpen]);

  const handleCopyUrl = () => {
    if (pairingUrl) {
      const fullUrl = `${window.location.origin}${pairingUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg sticky top-0">
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6" />
            <h2 className="text-xl font-bold">Emparejamiento de Dispositivo</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info del dispositivo */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Dispositivo</p>
            <p className="font-semibold text-gray-900">{dispositivo.nombre}</p>
            <p className="text-xs text-gray-500 mt-1">{dispositivo.ubicacion}</p>
          </div>

          {generarTokenMutation.isPending ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Método 1: Código QR */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <QrCode className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Método 1: Escanear Código QR
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Abre la cámara del dispositivo POS y escanea este código QR para emparejarlo
                      automáticamente sin necesidad de ingresar UUID o PIN.
                    </p>
                    {pairingUrl && (
                      <div className="bg-white p-4 rounded-lg border border-blue-200 inline-block">
                        <QRCodeSVG
                          value={`${window.location.origin}${pairingUrl}`}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Método 2: Enlace directo */}
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                    <LinkIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Método 2: Enlace Directo
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      Copia este enlace y ábrelo en el navegador del dispositivo POS. El dispositivo
                      se emparejará automáticamente.
                    </p>
                    {pairingUrl && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-white px-3 py-2 rounded border border-green-200 font-mono text-sm text-gray-700 overflow-x-auto">
                          {window.location.origin}{pairingUrl}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCopyUrl}
                          className="flex-shrink-0"
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Método 3: Login con empleado */}
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      Método 3: Login con Empleado (Quick Start)
                    </h3>
                    <p className="text-sm text-purple-700 mb-3">
                      Para dispositivos con modo Quick Start, el empleado puede iniciar sesión directamente
                      ingresando su email o DNI en el terminal POS, sin necesidad de conocer el UUID del
                      dispositivo.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <p className="text-sm text-gray-700">
                        <strong>En el terminal POS:</strong>
                      </p>
                      <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                        <li>Selecciona "Login con Empleado"</li>
                        <li>Ingresa tu email o DNI</li>
                        <li>El sistema te asignará un dispositivo disponible automáticamente</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información sobre expiración */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <p className="text-xs text-yellow-800">
                  <strong>⏱️ Nota:</strong> El código QR y el enlace son válidos por 24 horas. Después de ese
                  tiempo, deberás generar uno nuevo.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};
