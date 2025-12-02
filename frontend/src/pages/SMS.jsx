import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  DevicePhoneMobileIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import * as smsService from '../services/smsService';

const SMS = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('send');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Send SMS form
  const [smsForm, setSmsForm] = useState({
    to: '',
    message: ''
  });

  // Bulk SMS form
  const [bulkSMS, setBulkSMS] = useState([
    { to: '', message: '' }
  ]);

  // Template form
  const [templateForm, setTemplateForm] = useState({
    templateId: '',
    phone: '',
    data: {}
  });

  // Test configuration
  const [testPhone, setTestPhone] = useState('');

  // Load SMS status on mount
  useEffect(() => {
    loadSMSStatus();
  }, []);

  const loadSMSStatus = async () => {
    try {
      const data = await smsService.getSMSStatus();
      setStatus(data.data);
    } catch (error) {
      console.error('Error loading SMS status:', error);
      setMessage({
        type: 'error',
        text: 'Error al cargar estado del servicio SMS'
      });
    }
  };

  // Send single SMS
  const handleSendSMS = async (e) => {
    e.preventDefault();

    if (!smsService.isValidPhoneNumber(smsForm.to)) {
      setMessage({
        type: 'error',
        text: 'Número de teléfono inválido'
      });
      return;
    }

    if (!smsForm.message.trim()) {
      setMessage({
        type: 'error',
        text: 'El mensaje no puede estar vacío'
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await smsService.sendSMS(smsForm.to, smsForm.message);
      setMessage({
        type: 'success',
        text: `SMS enviado exitosamente a ${smsForm.to}`
      });
      setSmsForm({ to: '', message: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al enviar SMS'
      });
    } finally {
      setLoading(false);
    }
  };

  // Send bulk SMS
  const handleSendBulkSMS = async (e) => {
    e.preventDefault();

    // Validate all entries
    const validEntries = bulkSMS.filter(sms =>
      smsService.isValidPhoneNumber(sms.to) && sms.message.trim()
    );

    if (validEntries.length === 0) {
      setMessage({
        type: 'error',
        text: 'Debes agregar al menos un SMS válido'
      });
      return;
    }

    if (validEntries.length < bulkSMS.length) {
      setMessage({
        type: 'error',
        text: 'Algunos SMS tienen números inválidos o mensajes vacíos'
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await smsService.sendBulkSMS(validEntries);
      setMessage({
        type: 'success',
        text: result.message || `${result.data.successful} SMS enviados exitosamente`
      });
      setBulkSMS([{ to: '', message: '' }]);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al enviar SMS masivos'
      });
    } finally {
      setLoading(false);
    }
  };

  // Test SMS configuration
  const handleTestConfiguration = async (e) => {
    e.preventDefault();

    if (!smsService.isValidPhoneNumber(testPhone)) {
      setMessage({
        type: 'error',
        text: 'Número de teléfono inválido'
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await smsService.testSMSConfiguration(testPhone);
      setMessage({
        type: 'success',
        text: 'SMS de prueba enviado exitosamente'
      });
      setTestPhone('');
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al probar configuración SMS'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add bulk SMS row
  const addBulkSMSRow = () => {
    setBulkSMS([...bulkSMS, { to: '', message: '' }]);
  };

  // Remove bulk SMS row
  const removeBulkSMSRow = (index) => {
    setBulkSMS(bulkSMS.filter((_, i) => i !== index));
  };

  // Update bulk SMS row
  const updateBulkSMSRow = (index, field, value) => {
    const updated = [...bulkSMS];
    updated[index][field] = value;
    setBulkSMS(updated);
  };

  const tabs = [
    { id: 'send', name: 'Enviar SMS', icon: PaperAirplaneIcon },
    { id: 'bulk', name: 'Envío Masivo', icon: UserGroupIcon, adminOnly: true },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'config', name: 'Configuración', icon: DevicePhoneMobileIcon, adminOnly: true }
  ];

  const filteredTabs = tabs.filter(tab => !tab.adminOnly || user?.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SMS Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Envía notificaciones SMS a clientes y DJs
            </p>
          </div>
          <DevicePhoneMobileIcon className="h-12 w-12 text-blue-500" />
        </div>

        {/* Status indicator */}
        {status && (
          <div className="mt-4 flex items-center">
            {status.configured ? (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-green-700">
                  Servicio SMS configurado {status.fromNumber && `(${status.fromNumber})`}
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">
                  Servicio SMS no configurado (modo simulación)
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex">
            {message.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2" />
            ) : (
              <XCircleIcon className="h-5 w-5 mr-2" />
            )}
            <p className="text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {filteredTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Send SMS Tab */}
          {activeTab === 'send' && (
            <form onSubmit={handleSendSMS} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de teléfono
                </label>
                <input
                  type="tel"
                  value={smsForm.to}
                  onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                  placeholder="+1234567890 o (123) 456-7890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Formato: +1234567890 o (123) 456-7890
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje (máx. 1600 caracteres)
                </label>
                <textarea
                  value={smsForm.message}
                  onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={6}
                  maxLength={1600}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  {smsForm.message.length}/1600 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                    Enviar SMS
                  </>
                )}
              </button>
            </form>
          )}

          {/* Bulk SMS Tab */}
          {activeTab === 'bulk' && user?.role === 'admin' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Envío masivo de SMS. Verifica todos los números antes de enviar.
                </p>
              </div>

              <form onSubmit={handleSendBulkSMS} className="space-y-4">
                {bulkSMS.map((sms, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="tel"
                      value={sms.to}
                      onChange={(e) => updateBulkSMSRow(index, 'to', e.target.value)}
                      placeholder="Teléfono"
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      value={sms.message}
                      onChange={(e) => updateBulkSMSRow(index, 'message', e.target.value)}
                      placeholder="Mensaje"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    {bulkSMS.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBulkSMSRow(index)}
                        className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addBulkSMSRow}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
                >
                  + Agregar SMS
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      Enviar {bulkSMS.length} SMS
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  📧 Los templates SMS se envían automáticamente desde otras secciones del sistema.
                  Esta interfaz es solo informativa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {smsService.getSMSTemplates().map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">{template.icon}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {template.description}
                    </p>
                    <div className="text-xs text-gray-500">
                      <strong>Campos:</strong> {template.fields.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && user?.role === 'admin' && (
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Estado del Servicio
                </h3>
                {status && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-700">Estado:</span>
                      <span className={`text-sm ${status.configured ? 'text-green-600' : 'text-red-600'}`}>
                        {status.configured ? '✅ Configurado' : '❌ No configurado'}
                      </span>
                    </div>
                    {status.accountSid && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Account SID:</span>
                        <span className="text-sm text-gray-900">{status.accountSid}</span>
                      </div>
                    )}
                    {status.fromNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Número:</span>
                        <span className="text-sm text-gray-900">{status.fromNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Test Configuration */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Probar Configuración
                </h3>
                <form onSubmit={handleTestConfiguration} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enviar SMS de prueba a:
                    </label>
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <ClockIcon className="h-5 w-5 mr-2 animate-spin" />
                        Enviando prueba...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Enviar SMS de Prueba
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Documentation */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Configuración Twilio
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                  <p>Para configurar el servicio SMS, agrega estas variables en <code className="bg-gray-200 px-1 rounded">.env</code>:</p>
                  <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 overflow-x-auto">
{`TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890`}
                  </pre>
                  <p className="mt-2">
                    📚 <a href="https://www.twilio.com/console" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Obtener credenciales en Twilio Console
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SMS;
