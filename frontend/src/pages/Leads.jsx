import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Home, UserPlus, Mail, Phone, Building2, Calendar, DollarSign, Users, CheckCircle, XCircle, Eye, Edit, Trash2, LayoutGrid, List } from 'lucide-react';
import MinimalBackground from '../components/MinimalBackground';
import LeadKanban from '../components/LeadKanban';
import LeadTimeline from '../components/LeadTimeline';
import LeadScore from '../components/LeadScore';
import {
  Breadcrumbs,
  Table,
  TableCell,
  StatusBadge,
  SkeletonTable,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  Textarea,
  Alert
} from '../components';
import { toast } from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('kanban'); // 'tabla' o 'kanban'
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'view', 'edit'
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    tipo_evento: '',
    fecha_evento: '',
    ciudad: '',
    presupuesto_estimado: '',
    num_invitados: '',
    notas: ''
  });
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('detalles'); // 'detalles' o 'timeline'

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [filtroEstado]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const params = filtroEstado ? { estado: filtroEstado } : {};

      const response = await axios.get(`${API_URL}/leads`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setLeads(response.data.data || []);
    } catch (error) {
      console.error('Error al obtener leads:', error);
      toast.error('Error al cargar leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/leads/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      empresa: '',
      tipo_evento: '',
      fecha_evento: '',
      ciudad: '',
      presupuesto_estimado: '',
      num_invitados: '',
      notas: ''
    });
    setShowModal(true);
  };

  const handleView = (lead) => {
    setModalMode('view');
    setSelectedLead(lead);
    setFormData(lead);
    setActiveTab('detalles'); // Reset tab al abrir
    setShowModal(true);
  };

  const handleEdit = (lead) => {
    setModalMode('edit');
    setSelectedLead(lead);
    setFormData(lead);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('auth_token');

      if (modalMode === 'create') {
        await axios.post(`${API_URL}/leads`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Lead creado exitosamente');
      } else if (modalMode === 'edit') {
        await axios.put(`${API_URL}/leads/${selectedLead.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Lead actualizado exitosamente');
      }

      setShowModal(false);
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al guardar');
    }
  };

  const handleConvertToCliente = async (lead) => {
    if (!window.confirm(`¿Convertir "${lead.nombre}" a cliente?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/leads/${lead.id}/convert-to-cliente`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Lead convertido a cliente exitosamente');
      fetchLeads();
      fetchStats();

      // Opcional: redirigir a la página de clientes
      // navigate('/clientes');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Error al convertir');
    }
  };

  const handleMarkAsPerdido = async (lead) => {
    const razon = window.prompt('¿Por qué se perdió este lead?');
    if (!razon) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_URL}/leads/${lead.id}/mark-as-perdido`,
        { razon },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Lead marcado como perdido');
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al marcar como perdido');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este lead?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.delete(`${API_URL}/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Lead eliminado exitosamente');
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      nuevo: { variant: 'info', label: 'Nuevo' },
      contactado: { variant: 'primary', label: 'Contactado' },
      propuesta: { variant: 'warning', label: 'Propuesta' },
      ganado: { variant: 'success', label: 'Ganado' },
      perdido: { variant: 'error', label: 'Perdido' }
    };

    const config = estados[estado] || estados.nuevo;
    return <StatusBadge status={config.variant}>{config.label}</StatusBadge>;
  };

  const columns = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'contacto', label: 'Contacto' },
    { key: 'evento', label: 'Evento' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: 'Acciones' }
  ];

  const data = leads.map(lead => ({
    id: lead.id,
    nombre: (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{lead.nombre}</div>
          {lead.empresa && (
            <div className="text-sm text-gray-500 dark:text-gray-400">{lead.empresa}</div>
          )}
        </div>
      </div>
    ),
    contacto: (
      <div className="space-y-1">
        {lead.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Mail className="w-4 h-4" />
            <span>{lead.email}</span>
          </div>
        )}
        {lead.telefono && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Phone className="w-4 h-4" />
            <span>{lead.telefono}</span>
          </div>
        )}
      </div>
    ),
    evento: (
      <div className="space-y-1">
        {lead.tipo_evento && (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {lead.tipo_evento}
          </div>
        )}
        {lead.fecha_evento && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(lead.fecha_evento).toLocaleDateString()}
          </div>
        )}
        {lead.ciudad && (
          <div className="text-sm text-gray-500 dark:text-gray-400">{lead.ciudad}</div>
        )}
      </div>
    ),
    estado: getEstadoBadge(lead.estado),
    acciones: (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleView(lead)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleEdit(lead)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Editar"
        >
          <Edit className="w-4 h-4" />
        </button>
        {lead.estado !== 'ganado' && lead.estado !== 'perdido' && (
          <>
            <button
              onClick={() => handleConvertToCliente(lead)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              title="Convertir a cliente"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMarkAsPerdido(lead)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Marcar como perdido"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          onClick={() => handleDelete(lead.id)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )
  }));

  return (
    <>
      <MinimalBackground />

      <div className="relative space-y-8 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inicio', path: '/', icon: Home },
            { label: 'Leads', path: '/leads', icon: UserPlus }
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CRM - Leads</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona tus leads y conviértelos en clientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Botones de vista */}
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Vista Kanban"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('tabla')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'tabla'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title="Vista Tabla"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <Button onClick={handleCreate} className="shrink-0">
              <UserPlus className="w-5 h-5 mr-2" />
              Nuevo Lead
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{stats.nuevos}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Nuevos</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600">{stats.contactados}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Contactados</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-orange-600">{stats.propuestas}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Propuestas</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{stats.ganados}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Ganados</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-primary-600">{stats.conversion_rate}%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Conversión</div>
            </div>
          </div>
        )}

        {/* Filtros - solo en vista tabla */}
        {viewMode === 'tabla' && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrar por estado:
              </label>
              <Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-48"
              >
                <option value="">Todos</option>
                <option value="nuevo">Nuevo</option>
                <option value="contactado">Contactado</option>
                <option value="propuesta">Propuesta</option>
                <option value="ganado">Ganado</option>
                <option value="perdido">Perdido</option>
              </Select>
            </div>
          </div>
        )}

        {/* Vista Kanban o Tabla */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SkeletonTable columns={5} rows={5} />
          </div>
        ) : viewMode === 'kanban' ? (
          <LeadKanban
            leads={leads}
            onUpdate={fetchLeads}
            onView={handleView}
            onConvert={handleConvertToCliente}
            onMarkPerdido={handleMarkAsPerdido}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table
              columns={columns}
              data={data}
              emptyMessage="No hay leads registrados"
            />
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="lg">
          {modalMode === 'view' ? (
            // Modal de vista con tabs
            <>
              <ModalHeader>
                Detalles del Lead
              </ModalHeader>

              <ModalBody>
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('detalles')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'detalles'
                          ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Detalles
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'timeline'
                          ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Timeline
                    </button>
                  </nav>
                </div>

                {/* Contenido de tabs */}
                {activeTab === 'detalles' && (
                  <div className="space-y-6">
                    {/* Lead Score */}
                    {(selectedLead?.puntuacion || selectedLead?.probabilidad_conversion) && (
                      <LeadScore
                        score={selectedLead?.puntuacion || 0}
                        probability={selectedLead?.probabilidad_conversion || 0}
                      />
                    )}

                    {/* Información del Lead */}
                    <div className="space-y-4">
                      {/* Información de contacto */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre
                          </label>
                          <Input
                            type="text"
                            value={formData.nombre}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Empresa
                          </label>
                          <Input
                            type="text"
                            value={formData.empresa}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                          </label>
                          <Input
                            type="email"
                            value={formData.email}
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Teléfono
                          </label>
                          <Input
                            type="text"
                            value={formData.telefono}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Información del evento */}
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Información del Evento
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Tipo de Evento
                            </label>
                            <Input
                              type="text"
                              value={formData.tipo_evento}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Fecha del Evento
                            </label>
                            <Input
                              type="date"
                              value={formData.fecha_evento}
                              disabled
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ciudad
                            </label>
                            <Input
                              type="text"
                              value={formData.ciudad}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Presupuesto Estimado
                            </label>
                            <Input
                              type="number"
                              value={formData.presupuesto_estimado}
                              disabled
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Núm. Invitados
                            </label>
                            <Input
                              type="number"
                              value={formData.num_invitados}
                              disabled
                            />
                          </div>
                        </div>
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Notas
                        </label>
                        <Textarea
                          value={formData.notas}
                          rows={3}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div>
                    <LeadTimeline leadId={selectedLead?.id} />
                  </div>
                )}
              </ModalBody>

              <ModalFooter>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cerrar
                </Button>
                <Button onClick={() => handleEdit(selectedLead)}>
                  Editar Lead
                </Button>
              </ModalFooter>
            </>
          ) : (
            // Modal de crear/editar (formulario normal)
            <form onSubmit={handleSubmit}>
              <ModalHeader>
                {modalMode === 'create' && 'Nuevo Lead'}
                {modalMode === 'edit' && 'Editar Lead'}
              </ModalHeader>

              <ModalBody>
                <div className="space-y-4">
                  {/* Información de contacto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre *
                      </label>
                      <Input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Empresa
                      </label>
                      <Input
                        type="text"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono
                      </label>
                      <Input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Información del evento */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Información del Evento
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo de Evento
                        </label>
                        <Select
                          value={formData.tipo_evento}
                          onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Boda">Boda</option>
                          <option value="Cumpleaños">Cumpleaños</option>
                          <option value="Corporativo">Corporativo</option>
                          <option value="Fiesta privada">Fiesta privada</option>
                          <option value="Festival">Festival</option>
                          <option value="Otro">Otro</option>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fecha del Evento
                        </label>
                        <Input
                          type="date"
                          value={formData.fecha_evento}
                          onChange={(e) => setFormData({ ...formData, fecha_evento: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Ciudad
                        </label>
                        <Input
                          type="text"
                          value={formData.ciudad}
                          onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Presupuesto Estimado
                        </label>
                        <Input
                          type="number"
                          value={formData.presupuesto_estimado}
                          onChange={(e) => setFormData({ ...formData, presupuesto_estimado: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Núm. Invitados
                        </label>
                        <Input
                          type="number"
                          value={formData.num_invitados}
                          onChange={(e) => setFormData({ ...formData, num_invitados: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notas
                    </label>
                    <Textarea
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {modalMode === 'create' ? 'Crear' : 'Guardar'}
                </Button>
              </ModalFooter>
            </form>
          )}
        </Modal>
      )}
    </>
  );
};

export default Leads;
