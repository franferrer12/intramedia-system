import { FC, useState } from 'react';
import { Card, CardBody } from '../../components/ui/Card';
import {
  Zap,
  Calendar,
  Bell,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { notify } from '../../utils/notifications';

interface AutomationRule {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'evento' | 'nomina' | 'stock' | 'recordatorio';
  activa: boolean;
  configuracion: Record<string, any>;
}

export const AutomacionPage: FC = () => {
  const [reglas, setReglas] = useState<AutomationRule[]>([
    {
      id: '1',
      nombre: 'Transición Automática de Eventos',
      descripcion: 'Cambia el estado de eventos según la fecha y hora',
      tipo: 'evento',
      activa: true,
      configuracion: {
        anticipacionConfirmacion: 48, // horas antes
        marcarEnCursoAutomatico: true,
        finalizarDespuesHoras: 6,
      },
    },
    {
      id: '2',
      nombre: 'Generación Automática de Nóminas',
      descripcion: 'Crea nóminas el primer día de cada mes',
      tipo: 'nomina',
      activa: true,
      configuracion: {
        diaEjecucion: 1,
        horarioEjecucion: '00:00',
        enviarNotificacion: true,
      },
    },
    {
      id: '3',
      nombre: 'Alertas de Stock Bajo',
      descripcion: 'Notifica cuando productos alcanzan el stock mínimo',
      tipo: 'stock',
      activa: true,
      configuracion: {
        umbralAlerta: 10,
        frecuenciaRevision: 'diaria',
        notificarPorEmail: false,
      },
    },
    {
      id: '4',
      nombre: 'Recordatorios de Eventos',
      descripcion: 'Envía recordatorios antes de eventos planificados',
      tipo: 'recordatorio',
      activa: false,
      configuracion: {
        anticipacionDias: [7, 3, 1],
        horarioEnvio: '09:00',
        incluirDetalles: true,
      },
    },
  ]);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<AutomationRule | null>(null);

  const toggleRegla = (id: string) => {
    setReglas(
      reglas.map((r) =>
        r.id === id ? { ...r, activa: !r.activa } : r
      )
    );
    const regla = reglas.find((r) => r.id === id);
    notify.success(
      `Regla "${regla?.nombre}" ${!regla?.activa ? 'activada' : 'desactivada'}`,
      {
        duration: 3000,
      }
    );
  };

  const handleEdit = (regla: AutomationRule) => {
    setIsEditing(regla.id);
    setEditData({ ...regla });
  };

  const handleSave = () => {
    if (!editData) return;

    setReglas(reglas.map((r) => (r.id === editData.id ? editData : r)));
    setIsEditing(null);
    setEditData(null);
    notify.success(`✅ Configuración guardada`, {
      description: `Regla "${editData.nombre}" actualizada correctamente`,
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setEditData(null);
  };

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'evento':
        return Calendar;
      case 'nomina':
        return DollarSign;
      case 'stock':
        return Package;
      case 'recordatorio':
        return Bell;
      default:
        return Settings;
    }
  };

  const getColorByType = (tipo: string) => {
    switch (tipo) {
      case 'evento':
        return 'bg-blue-100 text-blue-600';
      case 'nomina':
        return 'bg-green-100 text-green-600';
      case 'stock':
        return 'bg-orange-100 text-orange-600';
      case 'recordatorio':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Automatizaciones
          </h1>
          <p className="text-gray-600 mt-2">
            Configura tareas automáticas para ahorrar tiempo
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-gray-600">
            {reglas.filter((r) => r.activa).length} de {reglas.length} activas
          </span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-blue-900">
              Funcionalidad en Desarrollo
            </h3>
            <p className="text-sm text-blue-800 mt-1">
              Las automatizaciones están configuradas pero requieren implementación en el backend.
              Los cambios aquí se guardarán localmente por ahora.
            </p>
          </div>
        </div>
      </div>

      {/* Reglas de Automatización */}
      <div className="grid grid-cols-1 gap-6">
        {reglas.map((regla) => {
          const Icon = getIconByType(regla.tipo);
          const isCurrentlyEditing = isEditing === regla.id;

          return (
            <Card key={regla.id}>
              <CardBody>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${getColorByType(regla.tipo)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {regla.nombre}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            regla.activa
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {regla.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {regla.descripcion}
                      </p>

                      {/* Configuración */}
                      {!isCurrentlyEditing ? (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase">
                            Configuración Actual
                          </h4>
                          {Object.entries(regla.configuracion).map(([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="text-gray-600">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="font-medium text-gray-900">
                                {typeof value === 'boolean'
                                  ? value
                                    ? '✓ Sí'
                                    : '✗ No'
                                  : Array.isArray(value)
                                  ? value.join(', ')
                                  : value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-semibold text-blue-900">
                            Editar Configuración
                          </h4>
                          {Object.entries(editData!.configuracion).map(([key, value]) => (
                            <div key={key} className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-gray-700">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </label>
                              {typeof value === 'boolean' ? (
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData!,
                                        configuracion: {
                                          ...editData!.configuracion,
                                          [key]: e.target.checked,
                                        },
                                      })
                                    }
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-sm text-gray-600">
                                    {value ? 'Activado' : 'Desactivado'}
                                  </span>
                                </label>
                              ) : Array.isArray(value) ? (
                                <input
                                  type="text"
                                  value={value.join(', ')}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData!,
                                      configuracion: {
                                        ...editData!.configuracion,
                                        [key]: e.target.value
                                          .split(',')
                                          .map((v) => v.trim())
                                          .map((v) => (isNaN(Number(v)) ? v : Number(v))),
                                      },
                                    })
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                              ) : (
                                <input
                                  type={typeof value === 'number' ? 'number' : 'text'}
                                  value={value}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData!,
                                      configuracion: {
                                        ...editData!.configuracion,
                                        [key]:
                                          typeof value === 'number'
                                            ? Number(e.target.value)
                                            : e.target.value,
                                      },
                                    })
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!isCurrentlyEditing ? (
                      <>
                        <button
                          onClick={() => toggleRegla(regla.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            regla.activa
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {regla.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleEdit(regla)}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Configurar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo Ahorrado (est.)</p>
                <p className="text-2xl font-bold text-gray-900">~12h/mes</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tareas Automatizadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {reglas.filter((r) => r.activa).length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Notificaciones Enviadas</p>
                <p className="text-2xl font-bold text-gray-900">247</p>
                <p className="text-xs text-gray-500">Este mes</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
