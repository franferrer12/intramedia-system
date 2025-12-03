import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Calendar, Users, TruckIcon, DollarSign, Plus, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard.api';
import { productosApi } from '../../api/productos.api';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { AlertasPedidos } from '../../components/pedidos/AlertasPedidos';

export const DashboardPage = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    staleTime: 2 * 60 * 1000, // Los datos se consideran frescos por 2 minutos
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
    refetchOnWindowFocus: false, // No refrescar al cambiar de ventana
  });

  // Obtener productos para alertas de stock
  const { data: productos = [] } = useQuery({
    queryKey: ['productos'],
    queryFn: productosApi.getAll,
    staleTime: 5 * 60 * 1000,
  });

  const productosSinStock = productos.filter(p => p.sinStock).length;
  const productosBajoStock = productos.filter(p => p.bajoStock && !p.sinStock).length;

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

      {/* Alertas Críticas */}
      {(productosSinStock > 0 || productosBajoStock > 0) && (
        <div className="space-y-3">
          {productosSinStock > 0 && (
            <Card className="border-l-4 border-red-500 bg-red-50">
              <CardBody className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg mr-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">
                      {productosSinStock} producto{productosSinStock > 1 ? 's' : ''} sin stock
                    </h3>
                    <p className="text-sm text-red-700">
                      Necesitas reponer urgentemente
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/inventario')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Ver productos
                </Button>
              </CardBody>
            </Card>
          )}

          {productosBajoStock > 0 && (
            <Card className="border-l-4 border-yellow-500 bg-yellow-50">
              <CardBody className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                    <Package className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      {productosBajoStock} producto{productosBajoStock > 1 ? 's' : ''} con stock bajo
                    </h3>
                    <p className="text-sm text-yellow-700">
                      Considera hacer pedido pronto
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/alertas-stock')}
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  Ver alertas
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Alertas de Pedidos */}
      <AlertasPedidos />

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Acciones Rápidas</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/pos-terminal')}
              className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
            >
              <ShoppingCart className="h-8 w-8 mb-2" />
              <span className="font-semibold">Nueva Venta</span>
            </button>

            <button
              onClick={() => navigate('/eventos')}
              className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
            >
              <Calendar className="h-8 w-8 mb-2" />
              <span className="font-semibold">Crear Evento</span>
            </button>

            <button
              onClick={() => navigate('/finanzas')}
              className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
            >
              <Plus className="h-8 w-8 mb-2" />
              <span className="font-semibold">Registrar Ingreso/Gasto</span>
            </button>

            <button
              onClick={() => navigate('/inventario')}
              className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all transform hover:scale-105 shadow-md"
            >
              <Package className="h-8 w-8 mb-2" />
              <span className="font-semibold">Ver Inventario</span>
            </button>
          </div>
        </CardBody>
      </Card>

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
