import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { JornadaModal } from '../../components/jornadas/JornadaModal';
import { jornadasApi } from '../../api/jornadas.api';
import { empleadosApi } from '../../api/empleados.api';
import { JornadaTrabajo, JornadaTrabajoFormData, Empleado } from '../../types';
import { Plus, Clock, DollarSign, Edit2, Trash2, CheckCircle, Calendar, User, Filter } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const JornadasPage = () => {
  const [jornadas, setJornadas] = useState<JornadaTrabajo[]>([]);
  const [filteredJornadas, setFilteredJornadas] = useState<JornadaTrabajo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJornada, setSelectedJornada] = useState<JornadaTrabajo | undefined>();
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<number>(0);
  const [estadoFiltro, setEstadoFiltro] = useState<'TODAS' | 'PAGADAS' | 'PENDIENTES'>('TODAS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedJornadas, setSelectedJornadas] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterJornadas();
  }, [jornadas, selectedEmpleado, estadoFiltro, fechaInicio, fechaFin]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [jornadasData, empleadosData] = await Promise.all([
        jornadasApi.getAll(),
        empleadosApi.getActivos(),
      ]);
      setJornadas(jornadasData);
      setEmpleados(empleadosData);
    } catch (error) {
      console.error('Error al cargar jornadas:', error);
      handleApiError(error, 'Error al cargar las jornadas');
    } finally {
      setIsLoading(false);
    }
  };

  const filterJornadas = () => {
    let filtered = [...jornadas];

    // Filtrar por empleado
    if (selectedEmpleado > 0) {
      filtered = filtered.filter(j => j.empleadoId === selectedEmpleado);
    }

    // Filtrar por estado de pago
    if (estadoFiltro === 'PAGADAS') {
      filtered = filtered.filter(j => j.pagado);
    } else if (estadoFiltro === 'PENDIENTES') {
      filtered = filtered.filter(j => !j.pagado);
    }

    // Filtrar por rango de fechas
    if (fechaInicio) {
      filtered = filtered.filter(j => j.fecha >= fechaInicio);
    }
    if (fechaFin) {
      filtered = filtered.filter(j => j.fecha <= fechaFin);
    }

    // Ordenar por fecha descendente
    filtered.sort((a, b) => {
      const dateCompare = new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      if (dateCompare !== 0) return dateCompare;
      // Si la fecha es la misma, ordenar por hora de inicio
      return b.horaInicio.localeCompare(a.horaInicio);
    });

    setFilteredJornadas(filtered);
  };

  const handleCreate = () => {
    setSelectedJornada(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (jornada: JornadaTrabajo) => {
    setSelectedJornada(jornada);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estas seguro de eliminar esta jornada? Esta accion no se puede deshacer.')) return;

    try {
      await jornadasApi.delete(id);
      notify.success('Jornada eliminada correctamente');
      loadData();
    } catch (error) {
      console.error('Error al eliminar jornada:', error);
      handleApiError(error, 'Error al eliminar la jornada');
    }
  };

  const handlePagar = async (jornada: JornadaTrabajo) => {
    const metodoPago = prompt('Metodo de pago (EFECTIVO/TRANSFERENCIA):', jornada.metodoPago || 'EFECTIVO');
    if (!metodoPago) return;

    try {
      await jornadasApi.marcarComoPagada(jornada.id, metodoPago.toUpperCase());
      notify.success('Jornada marcada como pagada');
      loadData();
    } catch (error) {
      console.error('Error al marcar jornada como pagada:', error);
      handleApiError(error, 'Error al marcar la jornada como pagada');
    }
  };

  const handlePagarSeleccionadas = async () => {
    if (selectedJornadas.size === 0) {
      notify.error('Debe seleccionar al menos una jornada');
      return;
    }

    const metodoPago = prompt('Metodo de pago (EFECTIVO/TRANSFERENCIA):', 'EFECTIVO');
    if (!metodoPago) return;

    if (!confirm(`¿Pagar ${selectedJornadas.size} jornadas seleccionadas?`)) return;

    try {
      await jornadasApi.pagarMultiples(Array.from(selectedJornadas), metodoPago.toUpperCase());
      notify.success(`${selectedJornadas.size} jornadas marcadas como pagadas`);
      setSelectedJornadas(new Set());
      loadData();
    } catch (error) {
      console.error('Error al pagar jornadas:', error);
      handleApiError(error, 'Error al pagar las jornadas seleccionadas');
    }
  };

  const handleSubmit = async (data: JornadaTrabajoFormData) => {
    try {
      if (selectedJornada) {
        await jornadasApi.update(selectedJornada.id, data);
        notify.success('Jornada actualizada correctamente');
      } else {
        await jornadasApi.create(data);
        notify.success('Jornada creada correctamente');
      }
      loadData();
    } catch (error) {
      console.error('Error al guardar jornada:', error);
      handleApiError(error, selectedJornada ? 'Error al actualizar la jornada' : 'Error al crear la jornada');
      throw error;
    }
  };

  const handleToggleSelection = (jornadaId: number) => {
    const newSelected = new Set(selectedJornadas);
    if (newSelected.has(jornadaId)) {
      newSelected.delete(jornadaId);
    } else {
      newSelected.add(jornadaId);
    }
    setSelectedJornadas(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJornadas.size === filteredJornadas.filter(j => !j.pagado).length) {
      setSelectedJornadas(new Set());
    } else {
      const pendientes = filteredJornadas.filter(j => !j.pagado).map(j => j.id);
      setSelectedJornadas(new Set(pendientes));
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(monto);
  };

  const formatHora = (hora: string) => {
    return hora.substring(0, 5); // HH:mm
  };

  const calcularTotales = () => {
    const totalJornadas = filteredJornadas.length;
    const pendientesPago = filteredJornadas.filter(j => !j.pagado).length;
    const totalPendiente = filteredJornadas
      .filter(j => !j.pagado)
      .reduce((sum, j) => sum + j.totalPago, 0);

    // Calcular horas del mes actual
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    const horasMes = filteredJornadas
      .filter(j => {
        const fechaJornada = new Date(j.fecha);
        return fechaJornada.getMonth() === mesActual && fechaJornada.getFullYear() === anioActual;
      })
      .reduce((sum, j) => sum + j.horasTrabajadas, 0);

    return { totalJornadas, pendientesPago, totalPendiente, horasMes };
  };

  const { totalJornadas, pendientesPago, totalPendiente, horasMes } = calcularTotales();

  const jornadasPendientesSeleccionables = filteredJornadas.filter(j => !j.pagado);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando jornadas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Turnos / Jornadas de Trabajo</h1>
          <p className="text-gray-600 mt-2">Gestion de turnos y pagos de empleados</p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Jornada
        </Button>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Jornadas</p>
                <p className="text-2xl font-bold text-gray-900">{totalJornadas}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes de Pago</p>
                <p className="text-2xl font-bold text-yellow-600">{pendientesPago}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pendiente</p>
                <p className="text-2xl font-bold text-red-600">{formatMonto(totalPendiente)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas del Mes</p>
                <p className="text-2xl font-bold text-purple-600">{horasMes.toFixed(1)}h</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empleado
              </label>
              <select
                value={selectedEmpleado}
                onChange={(e) => setSelectedEmpleado(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={0}>Todos los empleados</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.nombre} {empleado.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value as 'TODAS' | 'PAGADAS' | 'PENDIENTES')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="TODAS">Todas</option>
                <option value="PAGADAS">Pagadas</option>
                <option value="PENDIENTES">Pendientes</option>
              </select>
            </div>

            <div>
              <DatePicker
                label="Fecha Inicio"
                value={fechaInicio}
                onChange={(value) => setFechaInicio(value)}
              />
            </div>

            <div>
              <DatePicker
                label="Fecha Fin"
                value={fechaFin}
                onChange={(value) => setFechaFin(value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Boton Pagar Seleccionadas */}
      {jornadasPendientesSeleccionables.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedJornadas.size === jornadasPendientesSeleccionables.length && jornadasPendientesSeleccionables.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedJornadas.size > 0
                ? `${selectedJornadas.size} jornada${selectedJornadas.size > 1 ? 's' : ''} seleccionada${selectedJornadas.size > 1 ? 's' : ''}`
                : 'Seleccionar todas las pendientes'}
            </span>
          </div>
          {selectedJornadas.size > 0 && (
            <Button
              variant="primary"
              onClick={handlePagarSeleccionadas}
              className="flex items-center"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Pagar Seleccionadas ({formatMonto(
                filteredJornadas
                  .filter(j => selectedJornadas.has(j.id))
                  .reduce((sum, j) => sum + j.totalPago, 0)
              )})
            </Button>
          )}
        </div>
      )}

      {/* Lista de Jornadas */}
      {filteredJornadas.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay jornadas
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedEmpleado || estadoFiltro !== 'TODAS' || fechaInicio || fechaFin
                  ? 'No se encontraron jornadas con los filtros seleccionados'
                  : 'Comienza registrando la primera jornada de trabajo'}
              </p>
              <Button variant="primary" onClick={handleCreate}>
                Crear Jornada
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJornadas.map((jornada) => (
            <Card key={jornada.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {!jornada.pagado && (
                      <input
                        type="checkbox"
                        checked={selectedJornadas.has(jornada.id)}
                        onChange={() => handleToggleSelection(jornada.id)}
                        className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 cursor-pointer"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          jornada.pagado
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {jornada.pagado ? 'Pagada' : 'Pendiente'}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {jornada.empleadoNombre}
                        </h3>
                        <span className="text-sm text-gray-500">({jornada.empleadoDni})</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm text-gray-600 mt-3">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <div>
                            <div className="text-xs text-gray-500">Fecha</div>
                            <div className="font-medium">
                              {new Date(jornada.fecha).toLocaleDateString('es-ES')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <div>
                            <div className="text-xs text-gray-500">Horario</div>
                            <div className="font-medium">
                              {formatHora(jornada.horaInicio)} - {formatHora(jornada.horaFin)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-blue-600" />
                          <div>
                            <div className="text-xs text-gray-500">Horas</div>
                            <div className="font-medium">{jornada.horasTrabajadas.toFixed(2)}h</div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <div>
                            <div className="text-xs text-gray-500">Precio/Hora</div>
                            <div className="font-medium">{formatMonto(jornada.precioHora)}</div>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          <div>
                            <div className="text-xs text-gray-500">Total</div>
                            <div className="font-bold text-green-600">{formatMonto(jornada.totalPago)}</div>
                          </div>
                        </div>

                        {jornada.metodoPago && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">Pago</div>
                              <div className="font-medium">{jornada.metodoPago}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {jornada.eventoNombre && (
                        <div className="mt-2 text-sm text-gray-600">
                          <strong>Evento:</strong> {jornada.eventoNombre}
                        </div>
                      )}

                      {jornada.notas && (
                        <div className="mt-2 text-sm text-gray-500 italic">
                          {jornada.notas}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(jornada)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    {!jornada.pagado && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePagar(jornada)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Marcar como Pagada"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(jornada.id)}
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

      <JornadaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        jornada={selectedJornada}
      />
    </div>
  );
};
