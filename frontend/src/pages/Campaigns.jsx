import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import * as campaignService from '../services/campaignService';

const Campaigns = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Campaigns state
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Stats state
  const [summary, setSummary] = useState(null);

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    nombre: '',
    descripcion: '',
    asunto: '',
    contenidoHtml: '',
    contenidoTexto: '',
    tipoDestinatarios: 'leads',
    fechaEnvioProgramada: ''
  });

  // Template form
  const [templateForm, setTemplateForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'marketing',
    asunto: '',
    contenidoHtml: '',
    contenidoTexto: '',
    variablesDisponibles: []
  });

  // Load data on mount
  useEffect(() => {
    if (activeTab === 'campaigns') {
      loadCampaigns();
    } else if (activeTab === 'templates') {
      loadTemplates();
    } else if (activeTab === 'stats') {
      loadSummary();
    }
  }, [activeTab]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getCampaigns();
      setCampaigns(data.data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      setMessage({ type: 'error', text: 'Error al cargar campañas' });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getTemplates();
      setTemplates(data.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setMessage({ type: 'error', text: 'Error al cargar templates' });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getCampaignsSummary();
      setSummary(data.data || null);
    } catch (error) {
      console.error('Error loading summary:', error);
      setMessage({ type: 'error', text: 'Error al cargar estadísticas' });
    } finally {
      setLoading(false);
    }
  };

  // Create campaign
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await campaignService.createCampaign(campaignForm);
      setMessage({ type: 'success', text: 'Campaña creada exitosamente' });
      setShowCampaignModal(false);
      setCampaignForm({
        nombre: '',
        descripcion: '',
        asunto: '',
        contenidoHtml: '',
        contenidoTexto: '',
        tipoDestinatarios: 'leads',
        fechaEnvioProgramada: ''
      });
      loadCampaigns();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al crear campaña'
      });
    } finally {
      setLoading(false);
    }
  };

  // Create template
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Extract variables from HTML
      const variables = campaignService.extractVariables(templateForm.contenidoHtml);
      await campaignService.createTemplate({
        ...templateForm,
        variablesDisponibles: variables
      });
      setMessage({ type: 'success', text: 'Template creado exitosamente' });
      setShowTemplateModal(false);
      setTemplateForm({
        nombre: '',
        descripcion: '',
        categoria: 'marketing',
        asunto: '',
        contenidoHtml: '',
        contenidoTexto: '',
        variablesDisponibles: []
      });
      loadTemplates();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al crear template'
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;

    try {
      await campaignService.deleteCampaign(campaignId);
      setMessage({ type: 'success', text: 'Campaña eliminada' });
      loadCampaigns();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al eliminar campaña'
      });
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('¿Estás seguro de eliminar este template?')) return;

    try {
      await campaignService.deleteTemplate(templateId);
      setMessage({ type: 'success', text: 'Template eliminado' });
      loadTemplates();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al eliminar template'
      });
    }
  };

  // Send campaign
  const handleSendCampaign = async (campaignId, immediate = false) => {
    const confirmMsg = immediate
      ? '¿Enviar esta campaña inmediatamente?'
      : '¿Programar esta campaña para envío?';

    if (!confirm(confirmMsg)) return;

    try {
      await campaignService.sendCampaign(campaignId, immediate);
      setMessage({
        type: 'success',
        text: immediate ? 'Campaña enviándose...' : 'Campaña programada'
      });
      loadCampaigns();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error al enviar campaña'
      });
    }
  };

  const tabs = [
    { id: 'campaigns', name: 'Campañas', icon: EnvelopeIcon },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon },
    { id: 'stats', name: 'Estadísticas', icon: ChartBarIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marketing Automation</h1>
            <p className="mt-1 text-sm text-gray-500">
              Email campaigns y templates
            </p>
          </div>
          <EnvelopeIcon className="h-12 w-12 text-blue-500" />
        </div>
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
            {tabs.map((tab) => (
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
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Campañas de Email
                </h2>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nueva Campaña
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Cargando campañas...</p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay campañas creadas</p>
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Crear primera campaña
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {campaign.nombre}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full
                                bg-${campaignService.getCampaignStatusColor(campaign.estado)}-100
                                text-${campaignService.getCampaignStatusColor(campaign.estado)}-800`}
                            >
                              {campaignService.getCampaignStatusLabel(campaign.estado)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {campaign.asunto}
                          </p>
                          {campaign.descripcion && (
                            <p className="text-sm text-gray-500 mt-1">
                              {campaign.descripcion}
                            </p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm text-gray-500">
                            <span>📧 {campaign.total_destinatarios || 0} destinatarios</span>
                            <span>✅ {campaign.enviados || 0} enviados</span>
                            <span>👁️ {campaign.abiertos || 0} abiertos</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {campaign.estado === 'draft' && user?.role === 'admin' && (
                            <button
                              onClick={() => handleSendCampaign(campaign.id, true)}
                              className="text-green-600 hover:text-green-700"
                              title="Enviar ahora"
                            >
                              <PaperAirplaneIcon className="h-5 w-5" />
                            </button>
                          )}
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Templates de Email
                </h2>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Nuevo Template
                </button>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Cargando templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay templates creados</p>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700"
                  >
                    Crear primer template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {template.nombre}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {template.asunto}
                          </p>
                          {template.descripcion && (
                            <p className="text-sm text-gray-500 mt-1">
                              {template.descripcion}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {template.categoria}
                            </span>
                            {template.variables_disponibles && template.variables_disponibles.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {template.variables_disponibles.length} variables
                              </span>
                            )}
                          </div>
                        </div>
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Resumen de Campañas
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500">Cargando estadísticas...</p>
                </div>
              ) : summary ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-600">Total Campañas</div>
                    <div className="text-2xl font-bold text-blue-900 mt-2">
                      {summary.total_campaigns}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-600">Emails Enviados</div>
                    <div className="text-2xl font-bold text-green-900 mt-2">
                      {summary.total_emails_sent?.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-600">Tasa Apertura</div>
                    <div className="text-2xl font-bold text-purple-900 mt-2">
                      {campaignService.formatPercentage(summary.avg_open_rate)}
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-indigo-600">Tasa Click</div>
                    <div className="text-2xl font-bold text-indigo-900 mt-2">
                      {campaignService.formatPercentage(summary.avg_click_rate)}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600">Borradores</div>
                    <div className="text-2xl font-bold text-gray-900 mt-2">
                      {summary.draft}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-yellow-600">Programadas</div>
                    <div className="text-2xl font-bold text-yellow-900 mt-2">
                      {summary.scheduled}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-600">Enviadas</div>
                    <div className="text-2xl font-bold text-green-900 mt-2">
                      {summary.sent}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay estadísticas disponibles</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Nueva Campaña
            </h2>
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la campaña *
                </label>
                <input
                  type="text"
                  value={campaignForm.nombre}
                  onChange={(e) => setCampaignForm({ ...campaignForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto del email *
                </label>
                <input
                  type="text"
                  value={campaignForm.asunto}
                  onChange={(e) => setCampaignForm({ ...campaignForm, asunto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido HTML *
                </label>
                <textarea
                  value={campaignForm.contenidoHtml}
                  onChange={(e) => setCampaignForm({ ...campaignForm, contenidoHtml: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destinatarios *
                </label>
                <select
                  value={campaignForm.tipoDestinatarios}
                  onChange={(e) => setCampaignForm({ ...campaignForm, tipoDestinatarios: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {campaignService.getRecipientTypes().map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Nuevo Template
            </h2>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del template *
                </label>
                <input
                  type="text"
                  value={templateForm.nombre}
                  onChange={(e) => setTemplateForm({ ...templateForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={templateForm.categoria}
                  onChange={(e) => setTemplateForm({ ...templateForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  {campaignService.getTemplateCategories().map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  value={templateForm.asunto}
                  onChange={(e) => setTemplateForm({ ...templateForm, asunto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido HTML * (usa {{variable}} para placeholders)
                </label>
                <textarea
                  value={templateForm.contenidoHtml}
                  onChange={(e) => setTemplateForm({ ...templateForm, contenidoHtml: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="<h1>Hola {{nombre}}!</h1><p>{{mensaje}}</p>"
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creando...' : 'Crear Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
