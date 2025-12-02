import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  DollarSign,
  Music,
  UserCircle,
  UserPlus,
  Database,
  CalendarDays,
  Sun,
  Moon,
  Search,
  Maximize2,
  BarChart3,
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  TrendingUp,
  Sparkles,
  Menu,
  X,
  PieChart,
  Receipt,
  AlertTriangle,
  Activity,
  Shield
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationCenter from './NotificationCenter';
import PresentationMode from './PresentationMode';
import VirtualAssistant from './VirtualAssistant';
import RecentItems from './RecentItems';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, getUserDisplayName, isAgency, isIndividualDJ, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive handler
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Detect current page for contextual assistant
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/eventos')) return 'eventos';
    if (path.startsWith('/djs')) return 'djs';
    if (path.startsWith('/dj-comparison')) return 'dj-comparison';
    if (path.includes('/instagram')) return 'instagram';
    return 'dashboard';
  };

  // Trigger Command Palette
  const openCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      metaKey: true,
      bubbles: true
    });
    window.dispatchEvent(event);
  };

  // Toggle submenu
  const toggleSubmenu = (key) => {
    setExpandedMenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Estructura de navegación con submenús
  const navigationStructure = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      to: '/',
      color: 'primary'
    },
    {
      key: 'executive-dashboard',
      label: 'Dashboard Ejecutivo',
      icon: Activity,
      to: '/executive-dashboard',
      color: 'accent',
      badge: 'Pro'
    },
    {
      key: 'eventos-group',
      label: 'Eventos',
      icon: Calendar,
      color: 'secondary',
      submenu: [
        { to: '/eventos', label: 'Todos los Eventos', icon: Calendar },
        { to: '/calendario', label: 'Vista Calendario', icon: CalendarDays },
      ]
    },
    {
      key: 'artistas-group',
      label: 'Artistas',
      icon: Music,
      color: 'accent',
      submenu: [
        { to: '/djs', label: 'Todos los DJs', icon: Music },
        { to: '/agency-djs', label: 'Mis Artistas', icon: Users, agencyOnly: true },
        { to: '/dj-comparison', label: 'Comparación', icon: BarChart3 },
      ]
    },
    {
      key: 'solicitudes',
      label: 'Solicitudes',
      icon: FileText,
      to: '/solicitudes',
      color: 'primary',
      badge: 'new'
    },
    {
      key: 'gestion-group',
      label: 'Gestión',
      icon: Building2,
      color: 'secondary',
      submenu: [
        { to: '/leads', label: 'Leads (CRM)', icon: UserPlus },
        { to: '/clientes', label: 'Clientes', icon: Building2 },
        { to: '/financial', label: 'Finanzas', icon: DollarSign },
        { to: '/financial-alerts', label: 'Alertas Financieras', icon: AlertTriangle },
        { to: '/profit-distribution', label: 'Distribución de Beneficios', icon: PieChart },
        { to: '/monthly-expenses', label: 'Gastos Mensuales', icon: Receipt },
        { to: '/budget-comparison', label: 'Comparativa Presupuesto', icon: BarChart3 },
        { to: '/socios', label: 'Socios', icon: UserCircle },
        { to: '/nominas', label: 'Nóminas', icon: TrendingUp },
      ]
    },
    {
      key: 'djs-analytics-group',
      label: 'Análisis de DJs',
      icon: BarChart3,
      color: 'accent',
      submenu: [
        { to: '/djs-financial', label: 'Dashboard Financiero', icon: DollarSign },
        { to: '/dj-payments-pending', label: 'Pagos Pendientes', icon: Receipt },
        { to: '/dj-growth', label: 'Crecimiento & Rankings', icon: TrendingUp },
      ]
    },
    {
      key: 'clientes-analytics-group',
      label: 'Análisis de Clientes',
      icon: Users,
      color: 'secondary',
      submenu: [
        { to: '/clientes-financial', label: 'Dashboard Financiero', icon: DollarSign },
        { to: '/clientes-payments-pending', label: 'Cobros Pendientes', icon: Receipt },
        { to: '/clientes-loyalty', label: 'Fidelidad & Retención', icon: TrendingUp },
      ]
    },
    {
      key: 'herramientas',
      label: 'Herramientas',
      icon: Database,
      to: '/data-cleanup',
      color: 'accent'
    },
    {
      key: 'admin-group',
      label: 'Administración',
      icon: Settings,
      color: 'primary',
      adminOnly: true,
      submenu: [
        { to: '/equipment', label: 'Equipos', icon: Database, agencyOnly: true },
        { to: '/settings', label: 'Configuración', icon: Settings },
        { to: '/audit-logs', label: 'Logs de Auditoría', icon: Shield },
      ]
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      primary: 'text-primary-600 dark:text-primary-400 bg-gradient-to-r from-primary-500/20 to-transparent border-primary-500',
      secondary: 'text-secondary-600 dark:text-secondary-400 bg-gradient-to-r from-secondary-500/20 to-transparent border-secondary-500',
      accent: 'text-accent-600 dark:text-accent-400 bg-gradient-to-r from-accent-500/20 to-transparent border-accent-500',
    };
    return colors[color] || colors.primary;
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobile && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar con Glassmorphism */}
      <motion.aside
        initial={false}
        animate={{
          width: isMobile ? 280 : (sidebarCollapsed ? 80 : 280),
          x: isMobile ? (mobileMenuOpen ? 0 : -280) : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`${isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'} bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700/50 shadow-soft`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200 dark:border-slate-700/50">
            <AnimatePresence mode="wait">
              {(!sidebarCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 flex items-center justify-center shadow-glow">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 bg-clip-text text-transparent">
                      Intra Media
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Sistema de Gestión</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isMobile && (
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </button>
            )}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {navigationStructure
              .filter(item => {
                // Filter out admin-only items for non-admins
                if (item.adminOnly && !isAdmin()) return false;
                // Filter out items with submenus that are all agency-only when not an agency
                if (!item.submenu) return true;
                return item.submenu.some(sub => (!sub.agencyOnly || isAgency()) && (!sub.adminOnly || isAdmin()));
              })
              .map((item) => {
                const Icon = item.icon;
                const isExpanded = expandedMenus[item.key];
                const hasSubmenu = !!item.submenu;
                const isActive = item.to && location.pathname === item.to;
                const hasActiveChild = item.submenu?.some(sub => location.pathname === sub.to);

                if (hasSubmenu) {
                  // Menu item with submenu
                  return (
                    <div key={item.key} className="space-y-1">
                      <button
                        onClick={() => toggleSubmenu(item.key)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                          hasActiveChild
                            ? `${getColorClasses(item.color)} border-l-4 font-medium`
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${hasActiveChild ? '' : 'group-hover:scale-110 transition-transform'}`} />
                          {(!sidebarCollapsed || isMobile) && <span className="font-medium">{item.label}</span>}
                        </div>
                        {(!sidebarCollapsed || isMobile) && (
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        )}
                      </button>

                      {/* Submenu items */}
                      <AnimatePresence>
                        {isExpanded && (!sidebarCollapsed || isMobile) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="ml-4 space-y-1 overflow-hidden"
                          >
                            {item.submenu
                              .filter(sub => {
                                if (sub.agencyOnly && !isAgency()) return false;
                                if (sub.adminOnly && !isAdmin()) return false;
                                return true;
                              })
                              .map((subItem) => {
                                const SubIcon = subItem.icon;
                                return (
                                  <NavLink
                                    key={subItem.to}
                                    to={subItem.to}
                                    className={({ isActive }) =>
                                      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                                        isActive
                                          ? 'bg-slate-100 dark:bg-slate-700/50 text-primary-600 dark:text-primary-400 font-medium'
                                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:text-slate-900 dark:hover:text-slate-200'
                                      }`
                                    }
                                  >
                                    <SubIcon className="w-4 h-4" />
                                    <span className="text-sm">{subItem.label}</span>
                                  </NavLink>
                                );
                              })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                } else {
                  // Simple menu item
                  return (
                    <NavLink
                      key={item.key}
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                          isActive
                            ? `${getColorClasses(item.color)} border-l-4 font-medium shadow-sm`
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:translate-x-1'
                        }`
                      }
                    >
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      {(!sidebarCollapsed || isMobile) && (
                        <span className="font-medium">{item.label}</span>
                      )}
                      {item.badge && (!sidebarCollapsed || isMobile) && (
                        <span className="ml-auto px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-full animate-pulse-slow">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                }
              })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700/50 space-y-3">
            {/* Dark Mode Toggle */}
            {(!sidebarCollapsed || isMobile) && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700/50 dark:to-slate-800/50 hover:from-slate-200 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all shadow-sm"
              >
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {isDark ? 'Modo Oscuro' : 'Modo Claro'}
                </span>
                <div className="relative w-12 h-6 bg-slate-300 dark:bg-slate-600 rounded-full transition-colors">
                  <motion.div
                    animate={{ x: isDark ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                  >
                    {isDark ? (
                      <Moon className="w-3 h-3 text-primary-500" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-500" />
                    )}
                  </motion.div>
                </div>
              </motion.button>
            )}

            {/* User Menu */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shadow-md ${
                  isAgency() ? 'bg-gradient-to-br from-primary-500 to-primary-600' :
                  isIndividualDJ() ? 'bg-gradient-to-br from-secondary-500 to-secondary-600' :
                  'bg-gradient-to-br from-accent-500 to-accent-600'
                }`}>
                  {isAgency() ? <Building2 className="w-5 h-5" /> :
                   isIndividualDJ() ? <Music className="w-5 h-5" /> :
                   <UserCircle className="w-5 h-5" />}
                </div>
                {(!sidebarCollapsed || isMobile) && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isAgency() ? 'Agencia' : isIndividualDJ() ? 'DJ Individual' : 'Admin'}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </>
                )}
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-glow border border-slate-200 dark:border-slate-700 py-2 z-20 backdrop-blur-xl"
                    >
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cuenta</p>
                        <p className="text-sm text-slate-900 dark:text-white mt-1 font-medium">{user?.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Configuración
                      </button>

                      <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col md:flex-row">
        {/* Main content area */}
        <div className="flex-1 flex flex-col">
        {/* Header mejorado */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 px-4 sm:px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}

            {/* Search */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCommandPalette}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-600 dark:text-slate-400 text-sm border border-slate-200 dark:border-slate-600 shadow-sm flex-1 sm:flex-initial max-w-md"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Búsqueda rápida...</span>
              <span className="sm:hidden">Buscar...</span>
              <kbd className="ml-auto px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold shadow-sm hidden md:inline">
                ⌘K
              </kbd>
            </motion.button>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPresentationMode(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl transition-all shadow-md hover:shadow-glow text-sm font-semibold"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden md:inline">Presentación</span>
              </motion.button>
              <NotificationCenter />
            </div>
          </div>
        </header>

        {/* Page Content con animación */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 sm:p-6 md:p-8"
        >
          <Outlet />
        </motion.div>
        </div>

        {/* Recent Items Sidebar */}
        {!isMobile && (
          <aside className="w-80 bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700/50 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            <RecentItems />
          </aside>
        )}
      </main>

      {/* Presentation Mode */}
      <PresentationMode isOpen={isPresentationMode} onClose={() => setIsPresentationMode(false)} />

      {/* Virtual Assistant */}
      <VirtualAssistant currentPage={getCurrentPage()} />
    </div>
  );
};

export default Layout;
