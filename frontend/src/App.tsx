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
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />

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
