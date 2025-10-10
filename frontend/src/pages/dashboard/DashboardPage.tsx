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
      title: 'Eventos Este Mes',
      value: dashboardData?.eventosActivos?.toString() || '0',
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Personal',
      value: dashboardData?.totalUsuarios?.toString() || '0',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'Proveedores',
      value: dashboardData?.totalProveedores?.toString() || '0',
      icon: TruckIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'Ingresos del Mes',
      value: `$${dashboardData?.ingresosMes?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inicio</h1>
        <p className="text-gray-600 mt-2">Resumen de tu club</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardBody className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Próximos Eventos</h2>
          </CardHeader>
          <CardBody>
            {dashboardData?.proximosEventos && dashboardData.proximosEventos.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.proximosEventos.map((evento) => (
                  <div key={evento.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{evento.nombre}</p>
                      <p className="text-sm text-gray-600">{evento.fecha} - {evento.hora}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      evento.estado === 'Confirmado'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {evento.estado}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay eventos próximos</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Actividad Reciente</h2>
          </CardHeader>
          <CardBody>
            {dashboardData?.actividadReciente && dashboardData.actividadReciente.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.actividadReciente.map((actividad, index) => (
                  <div key={index} className="flex items-start py-3 border-b last:border-b-0">
                    <div className={`p-2 rounded-lg ${
                      actividad.tipo === 'EVENTO_CREADO'
                        ? 'bg-green-100'
                        : actividad.tipo === 'USUARIO_CREADO'
                        ? 'bg-blue-100'
                        : 'bg-purple-100'
                    }`}>
                      {actividad.tipo === 'EVENTO_CREADO' ? (
                        <Calendar className="h-4 w-4 text-green-600" />
                      ) : actividad.tipo === 'USUARIO_CREADO' ? (
                        <Users className="h-4 w-4 text-blue-600" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{actividad.descripcion}</p>
                      <p className="text-xs text-gray-600">{actividad.tiempoRelativo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay actividad reciente</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
