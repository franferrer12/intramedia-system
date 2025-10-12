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
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pos-terminal/standalone" element={<StandalonePOSPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/eventos" element={<EventosPage />} />
                    <Route path="/finanzas" element={<TransaccionesPage />} />
                    <Route path="/finanzas/dashboard" element={<DashboardFinanzasPage />} />
                    <Route path="/personal" element={<EmpleadosPage />} />
                    <Route path="/nominas" element={<NominasPage />} />
                    <Route path="/turnos" element={<JornadasPage />} />
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route path="/usuarios" element={<UsuariosPage />} />
                    <Route path="/proveedores" element={<ProveedoresPage />} />
                    <Route path="/inventario" element={<ProductosPage />} />
                    <Route path="/inventario/dashboard" element={<DashboardInventarioPage />} />
                    <Route path="/movimientos-stock" element={<MovimientosPage />} />
                    <Route path="/alertas-stock" element={<AlertasPage />} />
                    <Route path="/activos-fijos" element={<ActivosFijosPage />} />
                    <Route path="/inversiones" element={<InversionesPage />} />
                    <Route path="/roi" element={<RoiDashboardPage />} />
                    <Route path="/pos" element={<PosPage />} />
                    <Route path="/pos-terminal" element={<POSTerminalPage />} />
                    <Route path="/pos-monitor" element={<MonitorSesionesPage />} />
                    <Route path="/sesiones" element={<SesionesPage />} />
                    <Route path="/pos-dashboard" element={<POSDashboardPage />} />
                    <Route path="/ayuda" element={<AyudaPage />} />
                    <Route path="/ayuda/asistente" element={<AsistenteVirtualPage />} />
                    <Route path="/ayuda/novedades" element={<NovedadesPage />} />
                    <Route path="/configuracion/automatizacion" element={<AutomacionPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
