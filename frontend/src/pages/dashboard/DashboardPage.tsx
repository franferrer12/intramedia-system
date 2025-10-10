import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Calendar, Users, TruckIcon, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard.api';

export const DashboardPage = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 2 * 60 * 1000, // Los datos se consideran frescos por 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
    refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600">Error al cargar las estadísticas</p>
          <p className="text-sm text-gray-600 mt-2">Por favor, inténtalo de nuevo</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: '🎉 Eventos este Mes',
      subtitle: 'Fiestas y actividades planificadas',
      value: dashboardData?.eventosActivos?.toString() || '0',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
    },
    {
      title: '👥 Gente Trabajando',
      subtitle: 'Empleados en tu equipo',
      value: dashboardData?.totalUsuarios?.toString() || '0',
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
    },
    {
      title: '🚚 Proveedores',
      subtitle: 'Empresas que te venden',
      value: dashboardData?.totalProveedores?.toString() || '0',
      icon: TruckIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
    },
    {
      title: '💰 Ingresé este Mes',
      subtitle: 'Dinero que entró en el mes',
      value: `€${dashboardData?.ingresosMes?.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}`,
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-200',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
        <h1 className="text-4xl font-bold text-gray-900">👋 ¡Hola! Bienvenido a tu Club</h1>
        <p className="text-gray-700 mt-2 text-lg">Aquí puedes ver todo lo importante de un vistazo</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`bg-gradient-to-br ${stat.bgColor} rounded-lg shadow-lg p-6 border-2 ${stat.borderColor} transform transition hover:scale-105`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} shadow-md`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-gray-700 mb-1">{stat.title}</h3>
              <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-xs text-gray-600 font-medium">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow-lg border-2 border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">🎊 Próximas Fiestas</h2>
          </div>
          <div>
            {dashboardData?.proximosEventos && dashboardData.proximosEventos.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.proximosEventos.map((evento) => (
                  <div key={evento.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{evento.nombre}</p>
                        <p className="text-sm text-gray-600 mt-1">📅 {evento.fecha} · 🕐 {evento.hora}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                        evento.estado === 'Confirmado'
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {evento.estado === 'Confirmado' ? '✅ Confirmado' : '📋 Planificando'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No hay fiestas planificadas</p>
                <p className="text-sm text-gray-500 mt-1">Crea tu primer evento en la sección Eventos</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border-2 border-green-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">📝 Qué Pasó Últimamente</h2>
          </div>
          <div>
            {dashboardData?.actividadReciente && dashboardData.actividadReciente.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.actividadReciente.map((actividad, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    actividad.tipo === 'EVENTO_CREADO'
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                      : actividad.tipo === 'USUARIO_CREADO'
                      ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200'
                      : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        actividad.tipo === 'EVENTO_CREADO'
                          ? 'bg-green-500'
                          : actividad.tipo === 'USUARIO_CREADO'
                          ? 'bg-blue-500'
                          : 'bg-purple-500'
                      }`}>
                        {actividad.tipo === 'EVENTO_CREADO' ? (
                          <Calendar className="h-5 w-5 text-white" />
                        ) : actividad.tipo === 'USUARIO_CREADO' ? (
                          <Users className="h-5 w-5 text-white" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900">{actividad.descripcion}</p>
                        <p className="text-xs text-gray-600 mt-1">🕐 {actividad.tiempoRelativo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-600 font-medium">No hay movimientos recientes</p>
                <p className="text-sm text-gray-500 mt-1">Aquí aparecerán las últimas acciones</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
