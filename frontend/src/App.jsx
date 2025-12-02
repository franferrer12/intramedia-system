import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { useKeyboardShortcuts, KeyboardShortcutsHelp } from './hooks/useKeyboardShortcuts';
import SkipToMainContent from './components/SkipToMainContent';
import GlobalSearch from './components/GlobalSearch';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Eventos from './pages/Eventos';
import DJs from './pages/DJs';
import Clientes from './pages/Clientes';
import Leads from './pages/Leads';
import PublicLeadForm from './pages/PublicLeadForm';
import FinancialDashboard from './pages/FinancialDashboard';
import DJsFinancial from './pages/DJsFinancial';
import DJPaymentsPending from './pages/DJPaymentsPending';
import DJMetrics from './pages/DJMetrics';
import DJGrowthAnalysis from './pages/DJGrowthAnalysis';
import ClientesFinancial from './pages/ClientesFinancial';
import ClientesPaymentsPending from './pages/ClientesPaymentsPending';
import ClientesLoyalty from './pages/ClientesLoyalty';
import Nominas from './pages/Nominas';
import Socios from './pages/Socios';
import DataCleanup from './pages/DataCleanup';
import Calendario from './pages/Calendario';
import CalendarioAvanzado from './pages/CalendarioAvanzado';
import Solicitudes from './pages/Solicitudes';
import ProfitDistributionSettings from './pages/ProfitDistributionSettings';
import MonthlyExpenseManager from './pages/MonthlyExpenseManager';
import BudgetComparison from './pages/BudgetComparison';
import CommandPalette from './components/CommandPalette';
import QuickActionsPanel from './components/QuickActionsPanel';
import PriceCalculator from './components/PriceCalculator';
import DJComparisonDashboard from './components/DJComparisonDashboard';
import AgencyDJManagement from './components/AgencyDJManagement';
import FinancialAlerts from './pages/FinancialAlerts';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import JobsDemo from './pages/JobsDemo';
import SettingsPage from './pages/SettingsPage';
import Documents from './pages/Documents';
import Reservations from './pages/Reservations';
import PublicBookingForm from './pages/PublicBookingForm';
import Payments from './pages/Payments';
import CalendarSettings from './pages/CalendarSettings';
import AuditLogs from './pages/AuditLogs';
import Equipment from './pages/Equipment';
import SMS from './pages/SMS';

function App() {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  // Listen for show shortcuts event
  useEffect(() => {
    const handleShowShortcuts = () => setShowShortcuts(true);
    window.addEventListener('show-keyboard-shortcuts', handleShowShortcuts);
    return () => window.removeEventListener('show-keyboard-shortcuts', handleShowShortcuts);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SkipToMainContent />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
              },
            }}
          />
          <KeyboardShortcutsHelp isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
          <GlobalSearch />
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/leads/public" element={<PublicLeadForm />} />
          <Route path="/booking" element={<PublicBookingForm />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <CommandPalette />
                  <QuickActionsPanel onCalculatorOpen={() => setIsCalculatorOpen(true)} />
                  <PriceCalculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
                  <Layout />
                </>
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path="calendario-avanzado" element={<CalendarioAvanzado />} />
            <Route path="djs" element={<DJs />} />
            <Route path="solicitudes" element={<Solicitudes />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="leads" element={<Leads />} />
            <Route path="financial" element={<FinancialDashboard />} />
            <Route path="djs-financial" element={<DJsFinancial />} />
            <Route path="dj-payments-pending" element={<DJPaymentsPending />} />
            <Route path="dj-metrics" element={<DJMetrics />} />
            <Route path="dj-growth" element={<DJGrowthAnalysis />} />
            <Route path="clientes-financial" element={<ClientesFinancial />} />
            <Route path="clientes-payments-pending" element={<ClientesPaymentsPending />} />
            <Route path="clientes-loyalty" element={<ClientesLoyalty />} />
            <Route path="nominas" element={<Nominas />} />
            <Route path="socios" element={<Socios />} />
            <Route path="data-cleanup" element={<DataCleanup />} />
            <Route path="dj-comparison" element={<DJComparisonDashboard />} />
            <Route path="agency-djs" element={<AgencyDJManagement />} />
            <Route path="profit-distribution" element={<ProfitDistributionSettings />} />
            <Route path="monthly-expenses" element={<MonthlyExpenseManager />} />
            <Route path="budget-comparison" element={<BudgetComparison />} />
            <Route path="financial-alerts" element={<FinancialAlerts />} />
            <Route path="executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="jobs-demo" element={<JobsDemo />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="documents" element={<Documents />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="calendar-settings" element={<CalendarSettings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="sms" element={<SMS />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
