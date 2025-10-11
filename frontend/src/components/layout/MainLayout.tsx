import { FC, ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Calendar,
  Users,
  TruckIcon,
  DollarSign,
  LogOut,
  Menu,
  X,
  Clock,
  BarChart3,
  Package,
  ArrowRightLeft,
  Bell,
  Building2,
  TrendingUp,
  Percent,
  ShoppingCart,
  ClipboardList,
  Monitor,
  HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationSections = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Centro de Ayuda', href: '/ayuda', icon: HelpCircle, highlight: true },
      ]
    },
    {
      title: 'Punto de Venta',
      items: [
        { name: 'POS Dashboard', href: '/pos-dashboard', icon: Monitor },
        { name: 'POS', href: '/pos', icon: ShoppingCart },
        { name: 'Sesiones', href: '/sesiones', icon: ClipboardList },
      ]
    },
    {
      title: 'Operaciones',
      items: [
        { name: 'Eventos', href: '/eventos', icon: Calendar },
        { name: 'Proveedores', href: '/proveedores', icon: TruckIcon },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Inventario', href: '/inventario', icon: Package },
        { name: 'Dashboard', href: '/inventario/dashboard', icon: BarChart3 },
        { name: 'Movimientos', href: '/movimientos-stock', icon: ArrowRightLeft },
        { name: 'Alertas', href: '/alertas-stock', icon: Bell },
      ]
    },
    {
      title: 'Finanzas',
      items: [
        { name: 'Finanzas', href: '/finanzas', icon: DollarSign },
        { name: 'Activos Fijos', href: '/activos-fijos', icon: Building2 },
        { name: 'Inversiones', href: '/inversiones', icon: TrendingUp },
        { name: 'ROI Dashboard', href: '/roi', icon: Percent },
      ]
    },
    {
      title: 'Personal',
      items: [
        { name: 'Mi Equipo', href: '/personal', icon: Users },
        { name: 'Turnos', href: '/turnos', icon: Clock },
        { name: 'Nóminas', href: '/nominas', icon: DollarSign },
      ]
    },
    {
      title: 'Análisis',
      items: [
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Club Mgmt</h2>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.title}>
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isHighlighted = item.highlight;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? isHighlighted
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                              : 'bg-blue-50 text-blue-700'
                            : isHighlighted
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-blue-200 hover:to-purple-200'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                        {isHighlighted && !isActive(item.href) && (
                          <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                            Nuevo
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r overflow-y-auto">
          <div className="flex items-center px-6 py-5 border-b">
            <h2 className="text-2xl font-bold text-gray-900">Club Management</h2>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-4">
            {navigationSections.map((section) => (
              <div key={section.title}>
                <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isHighlighted = item.highlight;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                          isActive(item.href)
                            ? isHighlighted
                              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                              : 'bg-blue-50 text-blue-700'
                            : isHighlighted
                            ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 hover:from-blue-200 hover:to-purple-200'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                        {isHighlighted && !isActive(item.href) && (
                          <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                            Nuevo
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center ml-auto space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.rol}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
