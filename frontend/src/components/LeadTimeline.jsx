import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, Users, MessageSquare, RefreshCw, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

const LeadTimeline = ({ leadId, interactions }) => {
  const [timelineData, setTimelineData] = useState(interactions || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (leadId && !interactions) {
      fetchInteractions();
    } else if (interactions) {
      setTimelineData(interactions);
    }
  }, [leadId, interactions]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/interactions/lead/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimelineData(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar interacciones:', error);
      toast.error('Error al cargar el timeline');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (tipo) => {
    const iconMap = {
      llamada: Phone,
      email: Mail,
      reunion: Users,
      nota: MessageSquare,
      cambio_estado: RefreshCw
    };
    const IconComponent = iconMap[tipo] || MessageSquare;
    return <IconComponent className="w-5 h-5" />;
  };

  const getIconColor = (tipo) => {
    const colorMap = {
      llamada: 'bg-blue-500',
      email: 'bg-purple-600',
      reunion: 'bg-green-500',
      nota: 'bg-yellow-500',
      cambio_estado: 'bg-purple-600'
    };
    return colorMap[tipo] || 'bg-gray-500';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Hoy a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Ayer a las ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `Hace ${days} días`;
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <Clock className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No hay interacciones registradas</p>
        <p className="text-sm mt-1">Las actividades aparecerán aquí una vez que se registren</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Línea vertical */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-600 via-purple-400 to-transparent"></div>

      <div className="space-y-6">
        <AnimatePresence>
          {timelineData.map((item, index) => (
            <motion.div
              key={item.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="relative pl-14"
            >
              {/* Icono */}
              <div className={`absolute left-0 ${getIconColor(item.tipo)} text-white p-3 rounded-full shadow-lg ring-4 ring-white dark:ring-gray-800`}>
                {getIcon(item.tipo)}
              </div>

              {/* Contenido */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        {item.tipo === 'llamada' && 'Llamada'}
                        {item.tipo === 'email' && 'Email'}
                        {item.tipo === 'reunion' && 'Reunión'}
                        {item.tipo === 'nota' && 'Nota'}
                        {item.tipo === 'cambio_estado' && 'Cambio de Estado'}
                      </span>
                      {item.fecha_proxima_accion && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Recordatorio
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {item.descripcion || item.notas}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-3">
                  {item.usuario_nombre && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>{item.usuario_nombre}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(item.fecha || item.created_at)}</span>
                  </div>
                </div>

                {item.fecha_proxima_accion && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        Próxima acción: {new Date(item.fecha_proxima_accion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Indicador de fin */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: timelineData.length * 0.05 + 0.2 }}
        className="relative pl-14 mt-6"
      >
        <div className="absolute left-0 bg-gradient-to-br from-purple-600 to-purple-400 p-2 rounded-full">
          <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          Inicio del seguimiento
        </div>
      </motion.div>
    </div>
  );
};

export default LeadTimeline;
