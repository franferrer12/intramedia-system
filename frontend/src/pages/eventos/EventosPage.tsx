import { useState, useEffect } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EventoModal } from '../../components/eventos/EventoModal';
import { CalendarioEventos } from '../../components/eventos/CalendarioEventos';
import { PlantillaSelector, EventoPlantilla } from '../../components/eventos/PlantillaSelector';
import { eventosApi } from '../../api/eventos.api';
import { reportesApi } from '../../api/reportes.api';
import { Evento, EventoFormData, EstadoEvento } from '../../types';
import { Plus, Calendar, Users, Edit2, Trash2, DollarSign, FileDown, FileText, List, CalendarDays, Copy, Sparkles } from 'lucide-react';
import { notify, handleApiError } from '../../utils/notifications';

export const EventosPage = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlantillaSelectorOpen, setIsPlantillaSelectorOpen] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState<Evento | undefined>();
  const [plantillaDefaults, setPlantillaDefaults] = useState<Partial<EventoFormData> | undefined>();
  const [vistaActual, setVistaActual] = useState<'lista' | 'calendario'>('lista');

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setIsLoading(true);
      const data = await eventosApi.getAll();
      setEventos(data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      handleApiError(error, 'Error al cargar los eventos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedEvento(undefined);
    setPlantillaDefaults(undefined);
    setIsModalOpen(true);
  };

  const handleCreateFromTemplate = () => {
    setIsPlantillaSelectorOpen(true);
  };

  const handleSelectPlantilla = (plantilla: EventoPlantilla) => {
    setIsPlantillaSelectorOpen(false);
    setSelectedEvento(undefined);

    // Convertir defaults de plantilla a formato EventoFormData
    const defaults: Partial<EventoFormData> = {
      tipo: plantilla.tipo as any,
      estado: (plantilla.defaults.estado || 'PLANIFICADO') as EstadoEvento,
    };

    if (plantilla.defaults.capacidad) {
      defaults.aforoEsperado = plantilla.defaults.capacidad;
    }

    if (plantilla.defaults.precioEntrada !== undefined) {
      defaults.precioEntrada = plantilla.defaults.precioEntrada;
    }

    setPlantillaDefaults(defaults);
    setIsModalOpen(true);
  };

  const handleEdit = (evento: Evento) => {
    setSelectedEvento(evento);
    setPlantillaDefaults(undefined);
    setIsModalOpen(true);
  };

  const handleDuplicate = (evento: Evento) => {
    // Copiar todos los datos excepto id, fecha y hora
    const duplicateData: Partial<EventoFormData> = {
      nombre: `${evento.nombre} (copia)`,
      descripcion: evento.descripcion,
      tipo: evento.tipo as any,
      estado: 'PLANIFICADO' as EstadoEvento,
      aforoEsperado: evento.aforoEsperado,
      precioEntrada: evento.precioEntrada,
      artista: evento.artista,
      // Fecha y hora se dejarán vacías para que el usuario las configure
    };

    setSelectedEvento(undefined);
    setPlantillaDefaults(duplicateData);
    setIsModalOpen(true);

    notify.info(`📋 Duplicando evento "${evento.nombre}"`, {
      description: 'Configura la nueva fecha y hora',
      duration: 3000,
    });
  };

  const handleDelete = async (id: number) => {
    const evento = eventos.find(e => e.id === id);
    if (!confirm(`¿Estás seguro de eliminar el evento "${evento?.nombre}"? Esta acción no se puede deshacer.`)) return;

    try {
      await eventosApi.delete(id);
      notify.success(`🗑️ Evento "${evento?.nombre}" eliminado`);
      loadEventos();
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      handleApiError(error, 'Error al eliminar el evento');
    }
  };

  const handleSubmit = async (data: EventoFormData) => {
    try {
      if (selectedEvento) {
        await eventosApi.update(selectedEvento.id, data);
        notify.success(`✅ Evento "${data.nombre}" actualizado`, {
          action: {
            label: 'Ver calendario',
            onClick: () => {} // TODO: Implementar vista de calendario
          }
        });
      } else {
        const nuevoEvento = await eventosApi.create(data);
        notify.success(`🎉 Evento "${data.nombre}" creado para el ${data.fecha}`, {
          duration: 6000,
          action: {
            label: 'Ver detalles',
            onClick: () => handleEdit(nuevoEvento)
          }
        });
      }
      loadEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      handleApiError(error, 'Error al guardar el evento');
      throw error;
    }
  };

  const getEstadoColor = (estado: EstadoEvento) => {
    const colors = {
      PLANIFICADO: 'bg-blue-100 text-blue-800',
      CONFIRMADO: 'bg-green-100 text-green-800',
      EN_CURSO: 'bg-yellow-100 text-yellow-800',
      FINALIZADO: 'bg-gray-100 text-gray-800',
      CANCELADO: 'bg-red-100 text-red-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      REGULAR: 'Regular',
      ESPECIAL: 'Especial',
      CONCIERTO: 'Concierto',
      PRIVADO: 'Privado',
      TEMATICO: 'Temático',
    };
    return labels[tipo] || tipo;
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleExportExcel = async () => {
    try {
      // Get date range from last 30 days to today
      const fechaFin = new Date().toISOString().split('T')[0];
      const fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await reportesApi.exportEventosExcel(fechaInicio, fechaFin);
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

      await reportesApi.exportEventosPdf(fechaInicio, fechaFin);
      notify.success('PDF exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      handleApiError(error, 'Error al exportar el PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando eventos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Eventos y Fiestas</h1>
          <p className="text-gray-600 mt-2">Todas tus fiestas y eventos</p>
        </div>
        <div className="flex gap-2">
          {/* Toggle Vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVistaActual('lista')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                vistaActual === 'lista'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <button
              onClick={() => setVistaActual('calendario')}
              className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                vistaActual === 'calendario'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>

          <Button variant="outline" onClick={handleExportExcel} className="flex items-center">
            <FileDown className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button variant="outline" onClick={handleExportPdf} className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {/* Botón de plantillas */}
          <Button
            variant="outline"
            onClick={handleCreateFromTemplate}
            className="flex items-center bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
          >
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            <span className="hidden sm:inline">Usar Plantilla</span>
            <span className="sm:hidden">Plantilla</span>
          </Button>

          <Button variant="primary" onClick={handleCreate} className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Crear Evento</span>
            <span className="sm:hidden">Crear</span>
          </Button>
        </div>
      </div>

      {/* Vista de Calendario */}
      {vistaActual === 'calendario' && (
        <CalendarioEventos eventos={eventos} onEventClick={handleEdit} />
      )}

      {/* Vista de Lista */}
      {vistaActual === 'lista' && eventos.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay eventos registrados
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza creando tu primer evento
              </p>
              <Button variant="primary" onClick={handleCreate}>
                Crear Evento
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : vistaActual === 'lista' ? (
        <div className="grid grid-cols-1 gap-6">
          {eventos.map((evento) => (
            <Card key={evento.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {evento.nombre}
                      </h3>
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${getEstadoColor(
                          evento.estado
                        )}`}
                      >
                        {evento.estado}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {getTipoLabel(evento.tipo)}
                      </span>
                    </div>

                    {evento.descripcion && (
                      <p className="text-gray-600 text-sm mb-3">{evento.descripcion}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                          {new Date(evento.fecha).toLocaleDateString('es-ES')}
                          {evento.horaInicio && ` - ${evento.horaInicio}`}
                        </span>
                      </div>

                      {evento.aforoEsperado && (
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {evento.aforoReal || 0} / {evento.aforoEsperado} personas
                          </span>
                        </div>
                      )}

                      {evento.artista && (
                        <div className="flex items-center text-gray-600">
                          <span className="text-sm font-medium">Artista:</span>
                          <span className="text-sm ml-1">{evento.artista}</span>
                        </div>
                      )}

                      {evento.beneficio !== undefined && evento.beneficio !== 0 && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            Beneficio: {formatCurrency(evento.beneficio)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(evento)}
                      title="Duplicar evento"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(evento)}
                      title="Editar evento"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(evento.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar evento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}

      {/* Modal de Plantillas */}
      <PlantillaSelector
        onSelect={handleSelectPlantilla}
        onCancel={() => setIsPlantillaSelectorOpen(false)}
        isOpen={isPlantillaSelectorOpen}
      />

      {/* Modal de Evento */}
      <EventoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPlantillaDefaults(undefined);
        }}
        onSubmit={handleSubmit}
        evento={selectedEvento}
        initialData={plantillaDefaults}
      />
    </div>
  );
};
