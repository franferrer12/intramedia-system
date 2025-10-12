import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EventosPage } from './pages/eventos/EventosPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { ProveedoresPage } from './pages/proveedores/ProveedoresPage';
import { TransaccionesPage } from './pages/transacciones/TransaccionesPage';
import { DashboardFinanzasPage } from './pages/finanzas/DashboardFinanzasPage';
import { EmpleadosPage } from './pages/empleados/EmpleadosPage';
import { NominasPage } from './pages/nominas/NominasPage';
import { JornadasPage } from './pages/jornadas/JornadasPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { MovimientosPage } from './pages/movimientos/MovimientosPage';
import { AlertasPage } from './pages/alertas/AlertasPage';
import { DashboardInventarioPage } from './pages/inventario/DashboardInventarioPage';
import ActivosFijosPage from './pages/activos-fijos/ActivosFijosPage';
import InversionesPage from './pages/activos-fijos/InversionesPage';
import RoiDashboardPage from './pages/activos-fijos/RoiDashboardPage';
import PosPage from './pages/pos/PosPage';
import SesionesPage from './pages/pos/SesionesPage';
import { POSDashboardPage } from './pages/pos/POSDashboardPage';
import POSTerminalPage from './pages/pos/POSTerminalPage';
import MonitorSesionesPage from './pages/pos/MonitorSesionesPage';
import { AyudaPage } from './pages/ayuda/AyudaPage';
import { NovedadesPage } from './pages/ayuda/NovedadesPage';
import { AsistenteVirtualPage } from './pages/ayuda/AsistenteVirtualPage';
import { AutomacionPage } from './pages/configuracion/AutomacionPage';
import { StandalonePOSPage } from './pages/pos/standalone/StandalonePOSPage';
import { POSPairPage } from './pages/pos/standalone/POSPairPage';
import { WelcomePage } from './pages/welcome/WelcomePage';
import { DispositivosPOSPage } from './pages/dispositivos/DispositivosPOSPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Ruta principal - Selector */}
          <Route path="/" element={<WelcomePage />} />

          {/* Rutas públicas - DEBEN IR ANTES DEL WILDCARD */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pos-terminal/standalone" element={<StandalonePOSPage />} />
          <Route path="/pos-terminal/pair" element={<POSPairPage />} />

          {/* Rutas protegidas del backoffice */}
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
          <Route path="/eventos" element={<ProtectedRoute><MainLayout><EventosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/finanzas" element={<ProtectedRoute><MainLayout><TransaccionesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/finanzas/dashboard" element={<ProtectedRoute><MainLayout><DashboardFinanzasPage /></MainLayout></ProtectedRoute>} />
          <Route path="/personal" element={<ProtectedRoute><MainLayout><EmpleadosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/nominas" element={<ProtectedRoute><MainLayout><NominasPage /></MainLayout></ProtectedRoute>} />
          <Route path="/turnos" element={<ProtectedRoute><MainLayout><JornadasPage /></MainLayout></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><MainLayout><AnalyticsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><MainLayout><UsuariosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/proveedores" element={<ProtectedRoute><MainLayout><ProveedoresPage /></MainLayout></ProtectedRoute>} />
          <Route path="/inventario" element={<ProtectedRoute><MainLayout><ProductosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/inventario/dashboard" element={<ProtectedRoute><MainLayout><DashboardInventarioPage /></MainLayout></ProtectedRoute>} />
          <Route path="/movimientos-stock" element={<ProtectedRoute><MainLayout><MovimientosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/alertas-stock" element={<ProtectedRoute><MainLayout><AlertasPage /></MainLayout></ProtectedRoute>} />
          <Route path="/activos-fijos" element={<ProtectedRoute><MainLayout><ActivosFijosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/inversiones" element={<ProtectedRoute><MainLayout><InversionesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/roi" element={<ProtectedRoute><MainLayout><RoiDashboardPage /></MainLayout></ProtectedRoute>} />
          <Route path="/pos" element={<ProtectedRoute><MainLayout><PosPage /></MainLayout></ProtectedRoute>} />
          <Route path="/pos-terminal" element={<ProtectedRoute><MainLayout><POSTerminalPage /></MainLayout></ProtectedRoute>} />
          <Route path="/pos-monitor" element={<ProtectedRoute><MainLayout><MonitorSesionesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/sesiones" element={<ProtectedRoute><MainLayout><SesionesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/pos-dashboard" element={<ProtectedRoute><MainLayout><POSDashboardPage /></MainLayout></ProtectedRoute>} />
          <Route path="/dispositivos-pos" element={<ProtectedRoute><MainLayout><DispositivosPOSPage /></MainLayout></ProtectedRoute>} />
          <Route path="/ayuda" element={<ProtectedRoute><MainLayout><AyudaPage /></MainLayout></ProtectedRoute>} />
          <Route path="/ayuda/asistente" element={<ProtectedRoute><MainLayout><AsistenteVirtualPage /></MainLayout></ProtectedRoute>} />
          <Route path="/ayuda/novedades" element={<ProtectedRoute><MainLayout><NovedadesPage /></MainLayout></ProtectedRoute>} />
          <Route path="/configuracion/automatizacion" element={<ProtectedRoute><MainLayout><AutomacionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/backoffice" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
