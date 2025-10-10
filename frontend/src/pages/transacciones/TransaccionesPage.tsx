import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TransaccionModal } from '../../components/transacciones/TransaccionModal';
import { transaccionesApi } from '../../api/transacciones.api';
import { reportesApi } from '../../api/reportes.api';
import { Transaccion, TransaccionFormData, TipoTransaccion } from '../../types';
import { Plus, TrendingUp, TrendingDown, DollarSign, Edit2, Trash2, Calendar, Tag, FileDown, FileText } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const TransaccionesPage = () => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [filteredTransacciones, setFilteredTransacciones] = useState<Transaccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaccion, setSelectedTransaccion] = useState<Transaccion | undefined>();
  const [tipoFiltro, setTipoFiltro] = useState<TipoTransaccion | 'TODOS'>('TODOS');
  const [mesActual, setMesActual] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    loadTransacciones();
  }, []);

  useEffect(() => {
    filterTransacciones();
  }, [transacciones, tipoFiltro, mesActual]);

  const loadTransacciones = async () => {
    try {
      setIsLoading(true);
      const data = await transaccionesApi.getAll();
      setTransacciones(data);
    } catch (error) {
      console.error('Error al cargar transacciones:', error);
      handleApiError(error, 'Error al cargar las transacciones');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransacciones = () => {
    let filtered = [...transacciones];

    // Filtrar por tipo
    if (tipoFiltro !== 'TODOS') {
      filtered = filtered.filter(t => t.tipo === tipoFiltro);
    }

    // Filtrar por mes
    if (mesActual) {
      filtered = filtered.filter(t => t.fecha.startsWith(mesActual));
    }

    // Ordenar por fecha descendente
    filtered.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    setFilteredTransacciones(filtered);
  };

  const handleCreate = () => {
    setSelectedTransaccion(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (transaccion: Transaccion) => {
    setSelectedTransaccion(transaccion);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

    try {
      await transaccionesApi.delete(id);
      notify.success('Transacción eliminada correctamente');
      loadTransacciones();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      handleApiError(error, 'Error al eliminar la transacción');
    }
  };

  const handleSubmit = async (data: TransaccionFormData) => {
    try {
      if (selectedTransaccion) {
        await transaccionesApi.update(selectedTransaccion.id, data);
        notify.success('Transacción actualizada correctamente');
      } else {
        await transaccionesApi.create(data);
        notify.success('Transacción creada correctamente');
      }
      loadTransacciones();
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      throw error;
    }
  };

  const calcularTotales = () => {
    const totalIngresos = filteredTransacciones
      .filter(t => t.tipo === 'INGRESO')
      .reduce((sum, t) => sum + t.monto, 0);

    const totalGastos = filteredTransacciones
      .filter(t => t.tipo === 'GASTO')
      .reduce((sum, t) => sum + t.monto, 0);

    const balance = totalIngresos - totalGastos;

    return { totalIngresos, totalGastos, balance };
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(monto);
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleExportExcel = async () => {
    try {
      // Get date range from last 30 days to today
      const fechaFin = new Date().toISOString().split('T')[0];
      const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await reportesApi.exportTransaccionesExcel(fechaInicio, fechaFin);
      notify.success('Reporte exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      handleApiError(error, 'Error al exportar el reporte');
    }
  };

  const handleExportPdf = async () => {
    try {
      const fechaFin = new Date().toISOString().split('T')[0];
      const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await reportesApi.exportTransaccionesPdf(fechaInicio, fechaFin);
      notify.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      handleApiError(error, 'Error al exportar el PDF');
    }
  };

  const { totalIngresos, totalGastos, balance} = calcularTotales();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando transacciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-lg border-2 border-green-200">
        <h1 className="text-4xl font-bold text-gray-900">💰 Mi Dinero (Entradas y Salidas)</h1>
        <p className="text-gray-700 mt-2 text-lg">Todo lo que entra y sale de mi negocio</p>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleExportExcel} className="flex items-center">
          <FileDown className="h-4 w-4 mr-2" />
          Descargar Excel
        </Button>
        <Button variant="outline" onClick={handleExportPdf} className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
        <Button variant="primary" onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          ➕ Registrar Pago
        </Button>
      </div>

      {/* Resumen Financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">📈 Dinero que Entró</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{formatMonto(totalIngresos)}</p>
              <p className="text-xs text-gray-600 mt-1">ingresos totales</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-md">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow-lg p-6 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">📉 Dinero que Salió</p>
              <p className="text-4xl font-bold text-red-600 mt-2">{formatMonto(totalGastos)}</p>
              <p className="text-xs text-gray-600 mt-1">gastos totales</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-lg shadow-md">
              <TrendingDown className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-50 to-blue-100' : 'from-red-50 to-red-100'} rounded-lg shadow-lg p-6 border-2 ${balance >= 0 ? 'border-blue-200' : 'border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">💵 Lo que Me Queda</p>
              <p className={`text-4xl font-bold mt-2 ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatMonto(balance)}
              </p>
              <p className="text-xs text-gray-600 mt-1">{balance >= 0 ? 'ganancia' : 'pérdida'}</p>
            </div>
            <div className={`bg-gradient-to-br ${balance >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600'} p-3 rounded-lg shadow-md`}>
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                🔍 Filtrar por Tipo
              </label>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as TipoTransaccion | 'TODOS')}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-medium"
              >
                <option value="TODOS">Todos los movimientos</option>
                <option value="INGRESO">💰 Dinero que Entró</option>
                <option value="GASTO">💸 Dinero que Salió</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📅 ¿Qué Mes?
              </label>
              <input
                type="month"
                value={mesActual}
                onChange={(e) => setMesActual(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-medium"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Transacciones */}
      {filteredTransacciones.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay transacciones
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza registrando tu primera transacción
              </p>
              <Button variant="primary" onClick={handleCreate}>
                Crear Transacción
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTransacciones.map((transaccion) => (
            <Card key={transaccion.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        transaccion.tipo === 'INGRESO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaccion.tipo === 'INGRESO' ? 'Ingreso' : 'Gasto'}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaccion.concepto}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        {transaccion.categoriaNombre}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatFecha(transaccion.fecha)}
                      </div>
                      {transaccion.metodoPago && (
                        <div>
                          <strong>Pago:</strong> {transaccion.metodoPago}
                        </div>
                      )}
                      {transaccion.eventoNombre && (
                        <div>
                          <strong>Evento:</strong> {transaccion.eventoNombre}
                        </div>
                      )}
                      {transaccion.proveedorNombre && (
                        <div>
                          <strong>Proveedor:</strong> {transaccion.proveedorNombre}
                        </div>
                      )}
                    </div>

                    {transaccion.descripcion && (
                      <p className="text-gray-500 mt-2">{transaccion.descripcion}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        transaccion.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaccion.tipo === 'INGRESO' ? '+' : '-'}{formatMonto(transaccion.monto)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(transaccion)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(transaccion.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <TransaccionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        transaccion={selectedTransaccion}
      />
    </div>
  );
};
