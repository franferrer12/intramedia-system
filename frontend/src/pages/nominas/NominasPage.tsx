import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NominaModal } from '../../components/nominas/NominaModal';
import { nominasApi } from '../../api/nominas.api';
import { reportesApi } from '../../api/reportes.api';
import { Nomina, NominaFormData, EstadoNomina } from '../../types';
import { Plus, FileText, Clock, CheckCircle, DollarSign, Edit2, Trash2, XCircle, Calendar, User, Filter, FileDown } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const NominasPage = () => {
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [filteredNominas, setFilteredNominas] = useState<Nomina[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNomina, setSelectedNomina] = useState<Nomina | undefined>();
  const [periodos, setPeriodos] = useState<string[]>([]);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoNomina | 'TODOS'>('TODOS');
  const [isGenerandoMasivas, setIsGenerandoMasivas] = useState(false);
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [periodoGenerar, setPeriodoGenerar] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterNominas();
  }, [nominas, periodoFiltro, estadoFiltro]);

  const getCurrentPeriodo = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [nominasData, periodosData] = await Promise.all([
        nominasApi.getAll(),
        nominasApi.getAllPeriodos(),
      ]);
      setNominas(nominasData);
      setPeriodos(periodosData);

      // Establecer el periodo actual como filtro por defecto si existe
      const currentPeriodo = getCurrentPeriodo();
      if (periodosData.includes(currentPeriodo)) {
        setPeriodoFiltro(currentPeriodo);
      } else if (periodosData.length > 0) {
        setPeriodoFiltro(periodosData[0]);
      }
    } catch (error) {
      console.error('Error al cargar nominas:', error);
      handleApiError(error, 'Error al cargar las nominas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNominas = () => {
    let filtered = [...nominas];

    // Filtrar por periodo
    if (periodoFiltro) {
      filtered = filtered.filter(n => n.periodo === periodoFiltro);
    }

    // Filtrar por estado
    if (estadoFiltro !== 'TODOS') {
      filtered = filtered.filter(n => n.estado === estadoFiltro);
    }

    // Ordenar por fecha de pago descendente
    filtered.sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

    setFilteredNominas(filtered);
  };

  const handleCreate = () => {
    setSelectedNomina(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (nomina: Nomina) => {
    setSelectedNomina(nomina);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estas seguro de eliminar esta nomina? Esta accion no se puede deshacer.')) return;

    try {
      await nominasApi.delete(id);
      notify.success('Nomina eliminada correctamente');
      loadData();
    } catch (error) {
      console.error('Error al eliminar nomina:', error);
      handleApiError(error, 'Error al eliminar la nomina');
    }
  };

  const handleMarcarComoPagada = async (nomina: Nomina) => {
    const metodoPago = prompt('Metodo de pago:', 'Transferencia');
    if (!metodoPago) return;

    const referenciaPago = prompt('Referencia de pago (opcional):');

    try {
      await nominasApi.marcarComoPagada(nomina.id, metodoPago, referenciaPago || undefined);
      notify.success('Nomina marcada como pagada');
      loadData();
    } catch (error) {
      console.error('Error al marcar nomina como pagada:', error);
      handleApiError(error, 'Error al marcar la nomina como pagada');
    }
  };

  const handleCancelar = async (id: number) => {
    if (!confirm('¿Estas seguro de cancelar esta nomina?')) return;

    try {
      await nominasApi.cancelar(id);
      notify.success('Nomina cancelada correctamente');
      loadData();
    } catch (error) {
      console.error('Error al cancelar nomina:', error);
      handleApiError(error, 'Error al cancelar la nomina');
    }
  };

  const handleGenerarMasivas = () => {
    setPeriodoGenerar(getCurrentPeriodo());
    setShowGenerarModal(true);
  };

  const confirmarGenerarMasivas = async () => {
    if (!periodoGenerar) {
      notify.error('Debe seleccionar un periodo');
      return;
    }

    if (!confirm(`¿Generar nominas para todos los empleados activos del periodo ${formatPeriodo(periodoGenerar)}?`)) return;

    try {
      setIsGenerandoMasivas(true);
      const nominasGeneradas = await nominasApi.generarNominasMasivas(periodoGenerar);
      notify.success(`Se generaron ${nominasGeneradas.length} nominas correctamente`);
      setShowGenerarModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error al generar nominas masivas:', error);
      handleApiError(error, 'Error al generar las nominas masivas');
    } finally {
      setIsGenerandoMasivas(false);
    }
  };

  const handleSubmit = async (data: NominaFormData) => {
    try {
      if (selectedNomina) {
        await nominasApi.update(selectedNomina.id, data);
        notify.success('Nomina actualizada correctamente');
      } else {
        await nominasApi.create(data);
        notify.success('Nomina creada correctamente');
      }
      loadData();
    } catch (error) {
      console.error('Error al guardar nomina:', error);
      handleApiError(error, 'Error al guardar la nomina');
      throw error;
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(monto);
  };

  const formatPeriodo = (periodo: string) => {
    const [year, month] = periodo.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };

  const handleExportExcel = async () => {
    try {
      // Export current month by default
      const currentDate = new Date();
      const mes = currentDate.getMonth() + 1;
      const anio = currentDate.getFullYear();

      await reportesApi.exportNominasExcel(mes, anio);
      notify.success('Reporte exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      handleApiError(error, 'Error al exportar el reporte');
    }
  };

  const handleExportPdf = async () => {
    try {
      const currentDate = new Date();
      const mes = currentDate.getMonth() + 1;
      const anio = currentDate.getFullYear();

      await reportesApi.exportNominasPdf(mes, anio);
      notify.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      handleApiError(error, 'Error al exportar el PDF');
    }
  };

  const calcularTotales = () => {
    const totalNominas = filteredNominas.length;
    const nominasPendientes = filteredNominas.filter(n => n.estado === 'PENDIENTE').length;
    const nominasPagadas = filteredNominas.filter(n => n.estado === 'PAGADA').length;
    const totalNetoAPagar = filteredNominas
      .filter(n => n.estado === 'PENDIENTE')
      .reduce((sum, n) => sum + n.salarioNeto, 0);

    return { totalNominas, nominasPendientes, nominasPagadas, totalNetoAPagar };
  };

  const { totalNominas, nominasPendientes, nominasPagadas, totalNetoAPagar } = calcularTotales();

  const getEstadoBadgeClass = (estado: EstadoNomina) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAGADA':
        return 'bg-green-100 text-green-800';
      case 'CANCELADA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: EstadoNomina) => {
    switch (estado) {
      case 'PENDIENTE':
        return <Clock className="h-4 w-4" />;
      case 'PAGADA':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELADA':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando nominas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-200">
        <h1 className="text-4xl font-bold text-gray-900">💵 Pagar a la Gente</h1>
        <p className="text-gray-700 mt-2 text-lg">Los sueldos que tengo que pagar cada mes</p>
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
        <Button variant="secondary" onClick={handleGenerarMasivas} className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          ✨ Generar Todos los Sueldos
        </Button>
        <Button variant="primary" onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          ➕ Registrar Sueldo
        </Button>
      </div>

      {/* Resumen de Nominas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">📋 Total de Sueldos</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{totalNominas}</p>
              <p className="text-xs text-gray-600 mt-1">sueldos registrados</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-lg p-6 border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">⏳ Tengo que Pagar</p>
              <p className="text-4xl font-bold text-yellow-600 mt-2">{nominasPendientes}</p>
              <p className="text-xs text-gray-600 mt-1">sueldos pendientes</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-3 rounded-lg shadow-md">
              <Clock className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-lg p-6 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">✅ Ya Pagué</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{nominasPagadas}</p>
              <p className="text-xs text-gray-600 mt-1">sueldos pagados</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-md">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-lg p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-700">💰 Me Falta Pagar</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{formatMonto(totalNetoAPagar)}</p>
              <p className="text-xs text-gray-600 mt-1">dinero pendiente</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg shadow-md">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">🔍 Filtrar Sueldos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                📅 ¿Qué Mes?
              </label>
              <select
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-medium"
              >
                <option value="">Todos los meses</option>
                {periodos.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {formatPeriodo(periodo)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                💰 Estado del Pago
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as EstadoNomina | 'TODOS')}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-medium"
              >
                <option value="TODOS">Todos</option>
                <option value="PENDIENTE">⏳ Pendientes</option>
                <option value="PAGADA">✅ Pagadas</option>
                <option value="CANCELADA">❌ Canceladas</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Lista de Nominas */}
      {filteredNominas.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay nominas
              </h3>
              <p className="text-gray-600 mb-4">
                {periodoFiltro || estadoFiltro !== 'TODOS'
                  ? 'No se encontraron nominas con los filtros seleccionados'
                  : 'Comienza creando una nomina o generando nominas masivas'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={handleGenerarMasivas}>
                  Generar Nominas Masivas
                </Button>
                <Button variant="primary" onClick={handleCreate}>
                  Crear Nomina
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNominas.map((nomina) => (
            <Card key={nomina.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getEstadoBadgeClass(nomina.estado)}`}>
                        {getEstadoIcon(nomina.estado)}
                        {nomina.estado}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {nomina.empleadoNombre}
                      </h3>
                      <span className="text-sm text-gray-500">({nomina.empleadoDni})</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mt-3">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <div>
                          <div className="text-xs text-gray-500">Periodo</div>
                          <div className="font-medium">{formatPeriodo(nomina.periodo)}</div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <div>
                          <div className="text-xs text-gray-500">Salario Base</div>
                          <div className="font-medium">{formatMonto(nomina.salarioBase)}</div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <div>
                          <div className="text-xs text-gray-500">Salario Bruto</div>
                          <div className="font-medium">{formatMonto(nomina.salarioBruto)}</div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-500">Salario Neto</div>
                          <div className="font-bold text-green-600">{formatMonto(nomina.salarioNeto)}</div>
                        </div>
                      </div>
                    </div>

                    {nomina.horasExtra > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Horas Extra:</strong> {nomina.horasExtra}h x {formatMonto(nomina.precioHoraExtra)} = {formatMonto(nomina.horasExtra * nomina.precioHoraExtra)}
                      </div>
                    )}

                    {nomina.metodoPago && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Metodo de Pago:</strong> {nomina.metodoPago}
                        {nomina.referenciaPago && ` - Ref: ${nomina.referenciaPago}`}
                      </div>
                    )}

                    {nomina.notas && (
                      <div className="mt-2 text-sm text-gray-500 italic">
                        {nomina.notas}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(nomina)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    {nomina.estado === 'PENDIENTE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarcarComoPagada(nomina)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Marcar como Pagada"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}

                    {nomina.estado !== 'CANCELADA' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelar(nomina.id)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        title="Cancelar"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(nomina.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Crear/Editar Nomina */}
      <NominaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        nomina={selectedNomina}
      />

      {/* Modal de Generar Nominas Masivas */}
      {showGenerarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Generar Nominas Masivas</h2>
              <button
                onClick={() => setShowGenerarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Periodo (YYYY-MM)
              </label>
              <input
                type="month"
                value={periodoGenerar}
                onChange={(e) => setPeriodoGenerar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Se generaran nominas para todos los empleados activos del periodo seleccionado.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowGenerarModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={confirmarGenerarMasivas}
                isLoading={isGenerandoMasivas}
              >
                Generar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
