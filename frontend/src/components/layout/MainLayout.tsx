import { FC, ReactNode, useEffect } from 'react';
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
  ShoppingCart,
  ClipboardList,
  Monitor,
  HelpCircle,
  Search,
  Keyboard,
  Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter } from './NotificationCenter';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { useGlobalNavigationShortcuts } from '../../hooks/useKeyboardShortcuts';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);

  // Activar atajos de navegación globales
  useGlobalNavigationShortcuts();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K = Búsqueda global
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }

      // ? = Mostrar ayuda de atajos
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        // Solo si no está escribiendo
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShortcutsModalOpen(true);
        }
      }

      // F2 = Abrir Terminal POS
      if (e.key === 'F2') {
        e.preventDefault();
        navigate('/pos-terminal');
      }

      // Esc = Cerrar modales
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const navigationSections = [
    {
      title: 'Principal',
      items: [
        { name: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Ventas y Finanzas',
      items: [
        { name: 'Terminal POS', href: '/pos-terminal', icon: ShoppingCart },
        { name: 'Dashboard POS', href: '/pos-dashboard', icon: Monitor },
        { name: 'Dispositivos POS', href: '/dispositivos-pos', icon: Smartphone },
        { name: 'Sesiones de Caja', href: '/sesiones', icon: ClipboardList },
        { name: 'Dashboard Finanzas', href: '/finanzas/dashboard', icon: BarChart3 },
        { name: 'Transacciones', href: '/finanzas', icon: DollarSign },
        { name: 'Activos e Inversiones', href: '/activos-fijos', icon: Building2 },
      ]
    },
    {
      title: 'Eventos',
      items: [
        { name: 'Eventos y Fiestas', href: '/eventos', icon: Calendar },
      ]
    },
    {
      title: 'Inventario',
      items: [
        { name: 'Productos', href: '/inventario', icon: Package },
        { name: 'Proveedores', href: '/proveedores', icon: TruckIcon },
        { name: 'Movimientos', href: '/movimientos-stock', icon: ArrowRightLeft },
        { name: 'Alertas de Stock', href: '/alertas-stock', icon: Bell },
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
      title: 'Análisis y Ayuda',
      items: [
        { name: 'Análisis del Negocio', href: '/analytics', icon: BarChart3 },
        { name: 'Centro de Ayuda', href: '/ayuda', icon: HelpCircle, highlight: true },
      ]
    },
    {
      title: 'Configuración',
      items: [
        { name: 'Automatizaciones', href: '/configuracion/automatizacion', icon: Clock, highlight: true },
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

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Buscar...</span>
              <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center ml-auto lg:ml-0 space-x-2">
              {/* Keyboard Shortcuts Button */}
              <button
                onClick={() => setShortcutsModalOpen(true)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Atajos de teclado (?)"
              >
                <Keyboard className="h-5 w-5" />
              </button>

              {/* Notification Center */}
              <NotificationCenter />

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

      {/* Global Search */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={shortcutsModalOpen} onClose={() => setShortcutsModalOpen(false)} />
    </div>
  );
};
