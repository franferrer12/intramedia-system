import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Clock,
  TrendingUp,
  Package
} from 'lucide-react';

/**
 * NotificationCenter - Sistema de notificaciones inteligente
 *
 * Muestra alertas sobre:
 * - Eventos próximos (siguientes 7 días)
 * - Pagos pendientes
 * - Cobros vencidos
 * - Alertas de inventario bajo
 * - Nóminas pendientes
 */
const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // TODO: Get djId from authenticated user context
  // For now, using djId=1 as default
  const currentDjId = 1;

  // Fetch notifications from backend
  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/social-media/${currentDjId}/notifications?limit=10`);
      const result = await response.json();

      if (result.success) {
        // Transform backend notifications to component format
        const transformedNotifications = result.data.notifications.map(notif => ({
          id: notif.id,
          type: getNotificationType(notif.type),
          icon: getNotificationIcon(notif.type),
          title: notif.title,
          message: notif.message,
          time: formatTime(notif.created_at),
          unread: !notif.is_read,
          action: () => console.log('Navigate based on notification type'),
          actionLabel: getActionLabel(notif.type),
          priority: notif.priority
        }));

        setNotifications(transformedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Keep existing notifications on error
    } finally {
      setLoading(false);
    }
  };

  const getNotificationType = (type) => {
    const typeMap = {
      'milestone': 'success',
      'growth': 'success',
      'improvement': 'info',
      'achievement': 'success',
      'warning': 'warning'
    };
    return typeMap[type] || 'info';
  };

  const getNotificationIcon = (type) => {
    const iconMap = {
      'milestone': TrendingUp,
      'growth': TrendingUp,
      'improvement': CheckCircle,
      'achievement': CheckCircle,
      'warning': AlertTriangle
    };
    return iconMap[type] || Bell;
  };

  const getActionLabel = (type) => {
    const labelMap = {
      'milestone': 'Ver Instagram',
      'growth': 'Ver Instagram',
      'improvement': 'Ver Estadísticas',
      'achievement': 'Ver Post',
      'warning': 'Revisar'
    };
    return labelMap[type] || 'Ver Detalles';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    return notifTime.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => n.unread).length;
  }, [notifications]);

  const markAsRead = async (id) => {
    try {
      // Update locally immediately for better UX
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, unread: false } : n)
      );

      // Update on backend
      await fetch(`http://localhost:3001/api/social-media/${currentDjId}/notifications/${id}/read`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update locally immediately for better UX
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

      // Update on backend
      await fetch(`http://localhost:3001/api/social-media/${currentDjId}/notifications/read-all`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyle = (type) => {
    const styles = {
      success: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-700/50',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      error: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700/50',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        iconColor: 'text-red-600 dark:text-red-400'
      },
      warning: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-700/50',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        iconColor: 'text-yellow-600 dark:text-yellow-400'
      },
      info: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700/50',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: 'text-blue-600 dark:text-blue-400'
      }
    };
    return styles[type] || styles.info;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-lg transition-all duration-200 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 border border-white/20 dark:border-white/10"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />

        {/* Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Notificaciones
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-white/10">
                    {notifications.map((notification) => {
                      const Icon = notification.icon;
                      const style = getNotificationStyle(notification.type);

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`relative p-4 transition-colors ${
                            notification.unread
                              ? style.bg
                              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                          }`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={`flex-shrink-0 p-2 rounded-lg ${style.iconBg}`}>
                              <Icon className={`w-4 h-4 ${style.iconColor}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    {notification.time}
                                  </p>
                                </div>

                                {/* Clear button */}
                                <button
                                  onClick={() => clearNotification(notification.id)}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                  aria-label="Descartar notificación"
                                >
                                  <X className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                </button>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 mt-2">
                                {notification.actionLabel && (
                                  <button
                                    onClick={() => {
                                      markAsRead(notification.id);
                                      notification.action();
                                      setIsOpen(false);
                                    }}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                  >
                                    {notification.actionLabel}
                                  </button>
                                )}
                                {notification.unread && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                                  >
                                    Marcar como leída
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {notification.unread && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      No tienes notificaciones
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-white/10">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to notifications page
                    }}
                    className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Ver todas las notificaciones
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
