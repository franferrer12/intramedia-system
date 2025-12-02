import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import AuditLogTable from '../components/AuditLogTable';
import AuditLogFilters from '../components/AuditLogFilters';
import AuditLogStats, { EventTypeDistribution, HourlyActivityChart } from '../components/AuditLogStats';
import AuditLogDetail from '../components/AuditLogDetail';
import Breadcrumbs from '../components/Breadcrumbs';
import toast from '../utils/toast';
import {
  getAuditLogs,
  getAuditStatistics,
  exportAuditLogs
} from '../services/auditLogService';

/**
 * Audit Logs Page
 * Main dashboard for viewing and analyzing audit logs
 */
const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    eventType: '',
    entityType: '',
    status: '',
    startDate: '',
    endDate: '',
    userId: '',
    ipAddress: ''
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    total: 0,
    totalPages: 0
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [filters, pagination.page, pagination.sortBy, pagination.sortOrder]);

  // Load statistics
  useEffect(() => {
    loadStatistics();
  }, [filters.startDate, filters.endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getAuditLogs(filters, {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: pagination.sortBy,
        sortOrder: pagination.sortOrder
      });

      setLogs(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
        totalPages: response.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      const response = await getAuditStatistics(startDate, endDate);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
      eventType: '',
      entityType: '',
      status: '',
      startDate: '',
      endDate: '',
      userId: '',
      ipAddress: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (column, order) => {
    setPagination(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: order,
      page: 1
    }));
  };

  const handleLogClick = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await exportAuditLogs(filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Logs exportados exitosamente');
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      toast.error('Error al exportar los logs');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            Logs de Auditoría
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Registro completo de todas las operaciones del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || logs.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <AuditLogStats stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.events_by_type && (
          <EventTypeDistribution eventsByType={stats.events_by_type} />
        )}
        {stats?.hourly_distribution && (
          <HourlyActivityChart hourlyDistribution={stats.hourly_distribution} />
        )}
      </div>

      {/* Filters */}
      <AuditLogFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleFilterReset}
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registros de Auditoría
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.total.toLocaleString()} registro{pagination.total !== 1 ? 's' : ''} total{pagination.total !== 1 ? 'es' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          </div>
        ) : (
          <AuditLogTable
            logs={logs}
            onLogClick={handleLogClick}
            onSort={handleSort}
            sortBy={pagination.sortBy}
            sortOrder={pagination.sortOrder}
          />
        )}

        {/* Pagination */}
        {!loading && logs.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Mostrando página {pagination.page} de {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AuditLogDetail
        log={selectedLog}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
};

export default AuditLogs;
