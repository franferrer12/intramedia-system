import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Music,
  Award,
  TrendingUp,
  Star,
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';

/**
 * Timeline de Actividad del DJ
 * Muestra historial cronológico de eventos, logros y actividades
 */
const DJTimeline = ({ djId, eventosData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, evento, logro, milestone

  // Generar timeline items desde eventos reales + logros ficticios
  const generateTimelineItems = () => {
    const items = [];

    // Eventos reales
    eventosData?.forEach(evento => {
      items.push({
        id: `evento-${evento.id}`,
        tipo: 'evento',
        titulo: evento.nombre_evento || 'Evento',
        descripcion: `${evento.local_nombre || 'Local'} - ${evento.tipo_evento || 'Evento'}`,
        fecha: new Date(evento.fecha),
        estado: evento.estado,
        detalles: {
          cache: parseFloat(evento.cache_total) || 0,
          local: evento.local_nombre,
          categoria: evento.categoria
        }
      });
    });

    // Logros y milestones (mock data)
    items.push({
      id: 'logro-1',
      tipo: 'logro',
      titulo: '100 Eventos Completados',
      descripcion: 'Alcanzó el milestone de 100 eventos exitosos',
      fecha: new Date('2025-01-10'),
      icon: Award
    });

    items.push({
      id: 'milestone-1',
      tipo: 'milestone',
      titulo: 'Top 5 DJ del Mes',
      descripcion: 'Entró en el ranking de los 5 DJs más activos',
      fecha: new Date('2025-01-05'),
      icon: Star
    });

    items.push({
      id: 'logro-2',
      tipo: 'logro',
      titulo: 'Rating 5 Estrellas',
      descripcion: 'Recibió calificación perfecta en 10 eventos consecutivos',
      fecha: new Date('2024-12-20'),
      icon: Star
    });

    // Ordenar por fecha descendente
    return items.sort((a, b) => b.fecha - a.fecha);
  };

  const timelineItems = generateTimelineItems();

  // Filtrar items
  const filteredItems = timelineItems.filter(item => {
    const matchesSearch = item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.tipo === filterType;
    return matchesSearch && matchesFilter;
  });

  const getItemIcon = (item) => {
    if (item.icon) return item.icon;
    if (item.tipo === 'evento') return Calendar;
    if (item.tipo === 'logro') return Award;
    if (item.tipo === 'milestone') return TrendingUp;
    return Music;
  };

  const getItemColor = (item) => {
    if (item.tipo === 'logro') return 'from-yellow-500 to-orange-500';
    if (item.tipo === 'milestone') return 'from-purple-500 to-pink-500';
    if (item.estado === 'completado') return 'from-green-500 to-emerald-500';
    if (item.estado === 'cancelado') return 'from-red-500 to-rose-500';
    if (item.estado === 'confirmado') return 'from-blue-500 to-cyan-500';
    return 'from-gray-500 to-slate-500';
  };

  const getItemBgColor = (item) => {
    if (item.tipo === 'logro') return 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
    if (item.tipo === 'milestone') return 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800';
    if (item.estado === 'completado') return 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800';
    if (item.estado === 'cancelado') return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
    if (item.estado === 'confirmado') return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800';
    return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'completado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Completado
        </span>
      );
    }
    if (estado === 'cancelado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
          <XCircle className="w-3 h-3" />
          Cancelado
        </span>
      );
    }
    if (estado === 'confirmado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
          <Clock className="w-3 h-3" />
          Confirmado
        </span>
      );
    }
    return null;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const getMonthYear = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Agrupar por mes
  const groupedByMonth = filteredItems.reduce((acc, item) => {
    const monthYear = getMonthYear(item.fecha);
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en timeline..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('evento')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'evento'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setFilterType('logro')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'logro'
                ? 'bg-yellow-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Logros
          </button>
          <button
            onClick={() => setFilterType('milestone')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === 'milestone'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Milestones
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Total Eventos</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {timelineItems.filter(i => i.tipo === 'evento').length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Completados</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {timelineItems.filter(i => i.estado === 'completado').length}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Logros</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {timelineItems.filter(i => i.tipo === 'logro').length}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Milestones</span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {timelineItems.filter(i => i.tipo === 'milestone').length}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(groupedByMonth).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No hay actividad registrada</p>
          </div>
        ) : (
          Object.entries(groupedByMonth).map(([monthYear, items]) => (
            <div key={monthYear} className="space-y-4">
              {/* Month Header */}
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {monthYear}
                </h3>
                <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-1" />
              </div>

              {/* Timeline Items */}
              <div className="relative pl-8 space-y-4">
                {/* Vertical Line */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 to-purple-600" />

                {items.map((item, idx) => {
                  const Icon = getItemIcon(item);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline Dot */}
                      <div className={`absolute -left-6 top-3 w-4 h-4 rounded-full bg-gradient-to-br ${getItemColor(item)} shadow-lg`} />

                      {/* Content Card */}
                      <div className={`relative rounded-lg p-4 border ${getItemBgColor(item)} hover:shadow-lg transition-shadow`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${getItemColor(item)}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {item.titulo}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {item.descripcion}
                              </p>
                            </div>
                          </div>
                          {item.estado && getEstadoBadge(item.estado)}
                        </div>

                        {/* Details */}
                        {item.detalles && (
                          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            {item.detalles.cache && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <DollarSign className="w-4 h-4" />
                                €{item.detalles.cache.toFixed(0)}
                              </div>
                            )}
                            {item.detalles.local && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                {item.detalles.local}
                              </div>
                            )}
                            {item.detalles.categoria && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <Music className="w-4 h-4" />
                                {item.detalles.categoria}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatDate(item.fecha)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DJTimeline;
