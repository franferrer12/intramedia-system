import { useState, useEffect } from 'react';
import { djsAPI, estadisticasAPI, eventosAPI } from '../services/api';
import {
  Plus,
  Music,
  TrendingUp,
  Calendar,
  DollarSign,
  X,
  Mail,
  Phone,
  Award,
  BarChart3,
  Target,
  FileText,
  Activity,
  MessageSquare,
  FileDown,
  Globe,
  Home,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  ExportButton,
  Breadcrumbs,
  Skeleton,
  SkeletonCard,
  Badge,
  StatusBadge,
  Input,
  Select,
  Modal,
  ModalHeader,
  ModalBody,
  Tabs,
  TabPanel,
  TabPanels
} from '../components';
import DJStatCard3D from '../components/DJStatCard3D';
import DJPerformancePanel from '../components/DJPerformancePanel';
import DJContentManager from '../components/DJContentManager';
import DJTimeline from '../components/DJTimeline';
import DJFeedbackSystem from '../components/DJFeedbackSystem';
import DJGoalsManager from '../components/DJGoalsManager';
import DJMonthlyReportPDF from '../components/DJMonthlyReportPDF';
import DJSocialMediaAnalytics from '../components/DJSocialMediaAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import PhotoUpload from '../components/PhotoUpload';

const DJDetailModal = ({ dj, onClose, onUpdate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPhoto, setCurrentPhoto] = useState(dj.foto_url);
  const [activeTab, setActiveTab] = useState('estadisticas'); // estadisticas, performance, contenido, timeline
  const [djEventos, setDjEventos] = useState([]);

  useEffect(() => {
    loadStats();
    loadDJEventos();
  }, [selectedYear]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await estadisticasAPI.getDJStats(dj.id, selectedYear);
      setStats(res.data.data);
    } catch (error) {
      console.error('Error cargando estadísticas del DJ:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDJEventos = async () => {
    try {
      const res = await eventosAPI.getAll();
      // Filtrar eventos del DJ actual
      const eventosDJ = res.data.data.filter(evento => evento.dj_id === dj.id);
      setDjEventos(eventosDJ);
    } catch (error) {
      console.error('Error cargando eventos del DJ:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-32" />
            ))}
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const evolucionMensual = stats?.evolucion_mensual?.map(item => ({
    mes: item.mes,
    eventos: parseInt(item.eventos) || 0,
    facturacion: parseFloat(item.facturacion) || 0,
    ingresos: parseFloat(item.ingresos) || 0
  })) || [];

  const topLocales = stats?.top_locales?.slice(0, 5).map(item => ({
    nombre: item.local_nombre?.substring(0, 25) || 'N/A',
    eventos: parseInt(item.eventos) || 0
  })) || [];

  const categorias = stats?.distribucion_categorias?.map(item => ({
    nombre: item.categoria || 'Sin categoría',
    value: parseInt(item.eventos) || 0
  })) || [];

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  const tabs = [
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: Target },
    { id: 'objetivos', label: 'Objetivos', icon: Award },
    { id: 'contenido', label: 'Contenido', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Activity },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    { id: 'social', label: 'Social Media', icon: Globe },
    { id: 'reportes', label: 'Reportes PDF', icon: FileDown }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <PhotoUpload
              currentPhoto={currentPhoto}
              djId={dj.id}
              djName={dj.nombre}
              onPhotoUpdate={async (photoUrl) => {
                setCurrentPhoto(photoUrl);
                await djsAPI.update(dj.id, { foto_url: photoUrl });
                if (onUpdate) onUpdate();
              }}
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{dj.nombre}</h2>
              <p className="text-gray-600 dark:text-gray-400">Panel de gestión y seguimiento</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-28"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-[77px] bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 z-10">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">{activeTab === 'estadisticas' && (
          <>

          {/* KPIs - 3D Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DJStatCard3D
              title="Total Eventos"
              value={stats?.resumen?.total_eventos || 0}
              subtitle={`${selectedYear}`}
              icon={Calendar}
              color="blue"
              trend="up"
              trendValue="+12%"
              rating={4}
            />

            <DJStatCard3D
              title="Facturación Total"
              value={`€${parseFloat(stats?.resumen?.facturacion_total || 0).toLocaleString('es-ES', {minimumFractionDigits: 0})}`}
              subtitle="Total generado"
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+8%"
            />

            <DJStatCard3D
              title="Ingresos DJ"
              value={`€${parseFloat(stats?.resumen?.ingresos_dj || 0).toLocaleString('es-ES', {minimumFractionDigits: 0})}`}
              subtitle="Ganancia neta"
              icon={TrendingUp}
              color="purple"
              trend="up"
              trendValue="+5%"
            />

            <DJStatCard3D
              title="Bolo Promedio"
              value={`€${parseFloat(stats?.resumen?.bolo_promedio || 0).toFixed(0)}`}
              subtitle="Por evento"
              icon={Award}
              color="orange"
              trend="neutral"
              trendValue="0%"
            />
          </div>

          {/* Comparativa con Agencia */}
          {stats?.comparativa_agencia && (
            <div className="card bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Comparativa con Promedio de Agencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bolo Promedio DJ</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    €{parseFloat(stats?.resumen?.bolo_promedio || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    vs €{parseFloat(stats?.comparativa_agencia?.bolo_promedio_agencia || 0).toFixed(2)} agencia
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ingresos Promedio</p>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    €{parseFloat(stats?.resumen?.ingreso_promedio || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    vs €{parseFloat(stats?.comparativa_agencia?.ingreso_promedio_agencia || 0).toFixed(2)} agencia
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolución Mensual */}
            <div className="card dark:bg-gray-700 dark:border-gray-600">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Evolución Mensual - Eventos</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={evolucionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="eventos" fill="#3b82f6" name="Eventos" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Facturación e Ingresos */}
            <div className="card dark:bg-gray-700 dark:border-gray-600">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Facturación vs Ingresos</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolucionMensual}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="facturacion" stroke="#10b981" strokeWidth={2} name="Facturación" />
                  <Line type="monotone" dataKey="ingresos" stroke="#8b5cf6" strokeWidth={2} name="Ingresos DJ" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Locales y Categorías */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Locales */}
            <div className="card dark:bg-gray-700 dark:border-gray-600">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top 5 Locales</h3>
              {topLocales.length > 0 ? (
                <div className="space-y-3">
                  {topLocales.map((local, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: COLORS[idx] }}
                        >
                          {idx + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{local.nombre}</span>
                      </div>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{local.eventos} eventos</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay datos</p>
              )}
            </div>

            {/* Distribución por Categoría */}
            <div className="card dark:bg-gray-700 dark:border-gray-600">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Distribución por Categoría</h3>
              {categorias.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categorias}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ nombre, value }) => `${nombre}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorias.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay datos</p>
              )}
            </div>
          </div>
          </>
        )}

        {activeTab === 'performance' && (
          <DJPerformancePanel
            djId={dj.id}
            djData={dj}
            eventosData={djEventos}
          />
        )}

        {activeTab === 'objetivos' && (
          <DJGoalsManager
            djId={dj.id}
            djData={dj}
            eventosData={djEventos}
          />
        )}

        {activeTab === 'contenido' && (
          <DJContentManager
            djId={dj.id}
            djData={dj}
          />
        )}

        {activeTab === 'timeline' && (
          <DJTimeline
            djId={dj.id}
            eventosData={djEventos}
          />
        )}

        {activeTab === 'feedback' && (
          <DJFeedbackSystem
            djId={dj.id}
            djData={dj}
            eventosData={djEventos}
          />
        )}

        {activeTab === 'social' && (
          <DJSocialMediaAnalytics
            djId={dj.id}
            djData={dj}
            eventosData={djEventos}
          />
        )}

        {activeTab === 'reportes' && (
          <DJMonthlyReportPDF
            djId={dj.id}
            djData={dj}
            eventosData={djEventos}
          />
        )}
        </div>
      </div>
    </div>
  );
};

const DJCard = ({ dj, onClick }) => (
  <motion.div
    onClick={onClick}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{
      y: -8,
      scale: 1.02,
      transition: { duration: 0.3 }
    }}
    className="relative group cursor-pointer"
  >
    {/* Glow effect on hover */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-300" />

    {/* Card */}
    <div className="relative card hover:shadow-2xl transition-all overflow-hidden">
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-500" />

      <div className="relative flex items-start gap-4">
        <motion.img
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.3 }}
          src={dj.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dj.nombre)}&size=100&background=random`}
          alt={dj.nombre}
          className="w-20 h-20 rounded-full object-cover border-2 border-primary-200 dark:border-primary-700 group-hover:border-primary-400 dark:group-hover:border-primary-500 transition-colors shadow-lg"
        />
        <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{dj.nombre}</h3>
            {dj.tipo && (
              <Badge variant="secondary" className="mt-1">
                {dj.tipo}
              </Badge>
            )}
          </div>
          <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {dj.bio && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{dj.bio}</p>
        )}

        <div className="mt-3 space-y-1">
          {dj.email && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span className="truncate">{dj.email}</span>
            </div>
          )}
          {dj.telefono && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Phone className="w-4 h-4" />
              <span>{dj.telefono}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/20 flex items-center justify-between">
          <StatusBadge status={dj.activo ? 'active' : 'inactive'}>
            {dj.activo ? 'Activo' : 'Inactivo'}
          </StatusBadge>
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
            Ver estadísticas →
          </button>
        </div>
        </div>
      </div>
    </div>
  </motion.div>
);

const DJs = () => {
  const [djs, setDjs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDJ, setSelectedDJ] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDJs();
  }, []);

  const loadDJs = async () => {
    try {
      const res = await djsAPI.getAll();
      setDjs(res.data.data);
    } catch (error) {
      console.error('Error cargando DJs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDJs = djs.filter(dj =>
    dj.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Inicio', path: '/', icon: Home },
          { label: 'DJs', path: '/djs', icon: Users }
        ]}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">DJs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{djs.length} DJs en tu roster</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="Buscar DJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <ExportButton
            datos={filteredDJs}
            nombreArchivo={`djs-${new Date().toISOString().split('T')[0]}`}
            label="Exportar"
            className="w-full sm:w-auto"
          />
          <button className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Nuevo DJ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <SkeletonCard key={i} />
            ))}
          </>
        ) : filteredDJs.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No se encontraron DJs' : 'No hay DJs registrados'}
          </div>
        ) : (
          filteredDJs.map((dj) => (
            <DJCard
              key={dj.id}
              dj={dj}
              onClick={() => setSelectedDJ(dj)}
            />
          ))
        )}
      </div>

      {selectedDJ && (
        <DJDetailModal
          dj={selectedDJ}
          onClose={() => setSelectedDJ(null)}
          onUpdate={loadDJs}
        />
      )}
    </div>
  );
};

export default DJs;
