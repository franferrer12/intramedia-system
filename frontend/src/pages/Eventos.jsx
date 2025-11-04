import { useState, useEffect, useMemo } from 'react';
import { eventosAPI, djsAPI, clientesAPI } from '../services/api';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  X,
  Calendar,
  DollarSign,
  MapPin,
  Music,
  Building2,
  Clock,
  ChevronDown,
  Copy,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import ExportButton from '../components/ExportButton';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import FinancialBreakdown from '../components/FinancialBreakdown';

// Modal de Formulario Interactivo
const EventoFormModal = ({ evento, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    fecha: evento?.fecha || '',
    hora_inicio: evento?.hora_inicio || '',
    hora_fin: evento?.hora_fin || '',
    evento: evento?.evento || '',
    categoria: evento?.categoria || '',
    cliente: evento?.cliente || '',
    ciudad_lugar: evento?.ciudad_lugar || '',
    dj_id: evento?.dj_id || '',
    cache_total: evento?.cache_total || '',
    parte_dj: evento?.parte_dj || '',
    parte_agencia: evento?.parte_agencia || '',
    costo_alquiler: evento?.costo_alquiler || 0,
    otros_costos: evento?.otros_costos || 0,
    descripcion_costos: evento?.descripcion_costos || '',
    cobrado_cliente: evento?.cobrado_cliente || false,
    pagado_dj: evento?.pagado_dj || false,
    observaciones: evento?.observaciones || ''
  });

  const [djs, setDjs] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [djSearch, setDjSearch] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [showDjSuggestions, setShowDjSuggestions] = useState(false);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [selectedDJ, setSelectedDJ] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [djsRes, clientesRes] = await Promise.all([
        djsAPI.getAll(),
        clientesAPI.getAll()
      ]);
      setDjs(djsRes.data.data || []);
      setClientes(clientesRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Auto-calcular comisiones
  useEffect(() => {
    const total = parseFloat(formData.cache_total) || 0;
    if (total > 0) {
      const agencia = total * 0.30; // 30% agencia
      const dj = total - agencia;
      setFormData(prev => ({
        ...prev,
        parte_agencia: agencia.toFixed(2),
        parte_dj: dj.toFixed(2)
      }));
    }
  }, [formData.cache_total]);

  const filteredDjs = useMemo(() => {
    if (!djSearch) return djs.slice(0, 5);
    return djs.filter(dj =>
      dj.nombre.toLowerCase().includes(djSearch.toLowerCase())
    ).slice(0, 5);
  }, [djSearch, djs]);

  const filteredClientes = useMemo(() => {
    if (!clienteSearch) return clientes.slice(0, 5);
    return clientes.filter(c =>
      c.nombre?.toLowerCase().includes(clienteSearch.toLowerCase())
    ).slice(0, 5);
  }, [clienteSearch, clientes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (evento?.id) {
        await eventosAPI.update(evento.id, formData);
        toast.success('Evento actualizado');
      } else {
        await eventosAPI.create(formData);
        toast.success('Evento creado');
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando evento:', error);
      toast.error('Error al guardar evento');
    }
  };

  const selectDJ = (dj) => {
    setFormData({ ...formData, dj_id: dj.id });
    setDjSearch(dj.nombre);
    setSelectedDJ(dj);
    setShowDjSuggestions(false);
  };

  const selectCliente = (cliente) => {
    setFormData({ ...formData, cliente: cliente.nombre });
    setClienteSearch(cliente.nombre);
    setShowClienteSuggestions(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-white/20">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {evento ? 'Editar Evento' : 'Nuevo Evento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          {/* Fecha, Hora Inicio, Hora Fin y Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha"
              required
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              fullWidth
            />

            <Select
              label="Categoría"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              options={[
                { value: '', label: 'Seleccionar...' },
                { value: 'Boda', label: 'Boda' },
                { value: 'Cumpleaños', label: 'Cumpleaños' },
                { value: 'Discoteca', label: 'Discoteca' },
                { value: 'Corporativo', label: 'Corporativo' },
                { value: 'Festival', label: 'Festival' },
                { value: 'Privado', label: 'Privado' },
                { value: 'Otro', label: 'Otro' }
              ]}
              placeholder="Seleccionar categoría"
              fullWidth
            />
          </div>

          {/* Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="time"
              label="Hora Inicio"
              value={formData.hora_inicio}
              onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              icon={Clock}
              iconPosition="right"
              fullWidth
            />

            <Input
              type="time"
              label="Hora Fin"
              value={formData.hora_fin}
              onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
              icon={Clock}
              iconPosition="right"
              fullWidth
            />
          </div>

          {/* Nombre del Evento */}
          <Input
            type="text"
            label="Nombre del Evento"
            required
            value={formData.evento}
            onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
            placeholder="Ej: Boda María y Juan"
            fullWidth
          />

          {/* DJ con Autocompletado */}
          <div className="relative">
            <Input
              type="text"
              label="DJ"
              required
              value={djSearch}
              onChange={(e) => {
                setDjSearch(e.target.value);
                setShowDjSuggestions(true);
              }}
              onFocus={() => setShowDjSuggestions(true)}
              placeholder="Buscar DJ..."
              icon={Music}
              iconPosition="right"
              fullWidth
            />

            {showDjSuggestions && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredDjs.length === 0 ? (
                  <div className="p-3 text-gray-500 dark:text-gray-400 text-sm">No se encontraron DJs</div>
                ) : (
                  filteredDjs.map(dj => (
                    <button
                      key={dj.id}
                      type="button"
                      onClick={() => selectDJ(dj)}
                      className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 text-left flex items-center gap-3 border-b border-gray-200 dark:border-white/20 last:border-b-0"
                    >
                      <img
                        src={dj.foto_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dj.nombre)}&size=40`}
                        alt={dj.nombre}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{dj.nombre}</div>
                        {dj.email && <div className="text-xs text-gray-500 dark:text-gray-400">{dj.email}</div>}
                        {dj.availability && (
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                            ✓ Disponibilidad configurada
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Disponibilidad del DJ Seleccionado */}
          {selectedDJ && selectedDJ.availability && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    Disponibilidad de {selectedDJ.nombre}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    Este DJ ha configurado su disponibilidad en el sistema. Verifica que la fecha seleccionada esté disponible.
                  </p>
                  {selectedDJ.location && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      📍 Ubicación: {selectedDJ.location}
                    </p>
                  )}
                  {selectedDJ.artistic_name && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      🎤 Nombre artístico: {selectedDJ.artistic_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Cliente con Autocompletado */}
          <div className="relative">
            <Input
              type="text"
              label="Cliente / Local"
              required
              value={clienteSearch || formData.cliente}
              onChange={(e) => {
                const value = e.target.value;
                setClienteSearch(value);
                setFormData({ ...formData, cliente: value });
                setShowClienteSuggestions(true);
              }}
              onFocus={() => setShowClienteSuggestions(true)}
              placeholder="Buscar o escribir cliente..."
              icon={Building2}
              iconPosition="right"
              fullWidth
            />

            {showClienteSuggestions && filteredClientes.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredClientes.map(cliente => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => selectCliente(cliente)}
                    className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 text-left border-b border-gray-200 dark:border-white/20 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{cliente.nombre}</div>
                    {cliente.contacto && <div className="text-xs text-gray-500 dark:text-gray-400">{cliente.contacto}</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ciudad */}
          <Input
            type="text"
            label="Ciudad / Lugar"
            value={formData.ciudad_lugar}
            onChange={(e) => setFormData({ ...formData, ciudad_lugar: e.target.value })}
            placeholder="Ej: Valencia"
            fullWidth
          />

          {/* Cachés */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-900 dark:text-green-400 font-medium">
              <DollarSign className="w-5 h-5" />
              <span>Información Financiera</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Caché Total *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cache_total}
                  onChange={(e) => setFormData({ ...formData, cache_total: e.target.value })}
                  className="input w-full pr-8"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parte DJ (70%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.parte_dj}
                    onChange={(e) => setFormData({ ...formData, parte_dj: e.target.value })}
                    className="input w-full pr-8 bg-gray-50 dark:bg-gray-700/50"
                    readOnly
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Parte Agencia (30%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.parte_agencia}
                    onChange={(e) => setFormData({ ...formData, parte_agencia: e.target.value })}
                    className="input w-full pr-8 bg-gray-50 dark:bg-gray-700/50"
                    readOnly
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                </div>
              </div>
            </div>
          </div>

          {/* Costos Adicionales */}
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-purple-900 dark:text-purple-400 font-medium">
              <DollarSign className="w-5 h-5" />
              <span>Costos Adicionales</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Costo Alquiler
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costo_alquiler}
                    onChange={(e) => setFormData({ ...formData, costo_alquiler: e.target.value })}
                    className="input w-full pr-8"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Otros Costos
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.otros_costos}
                    onChange={(e) => setFormData({ ...formData, otros_costos: e.target.value })}
                    className="input w-full pr-8"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción de Costos
              </label>
              <textarea
                value={formData.descripcion_costos}
                onChange={(e) => setFormData({ ...formData, descripcion_costos: e.target.value })}
                rows={2}
                className="input w-full resize-none"
                placeholder="Detalle de los costos adicionales..."
              />
            </div>

            {/* Beneficio Bruto en tiempo real */}
            {formData.parte_agencia && (
              <div className="pt-3 border-t border-purple-200 dark:border-purple-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Beneficio Bruto
                  </span>
                  <span className={`text-lg font-bold ${
                    (parseFloat(formData.parte_agencia) - parseFloat(formData.costo_alquiler || 0) - parseFloat(formData.otros_costos || 0)) >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    €{(parseFloat(formData.parte_agencia) - parseFloat(formData.costo_alquiler || 0) - parseFloat(formData.otros_costos || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Estados */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-white/20 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <input
                type="checkbox"
                checked={formData.cobrado_cliente}
                onChange={(e) => setFormData({ ...formData, cobrado_cliente: e.target.checked })}
                className="w-5 h-5"
              />
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${formData.cobrado_cliente ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">Cobrado</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-white/20 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <input
                type="checkbox"
                checked={formData.pagado_dj}
                onChange={(e) => setFormData({ ...formData, pagado_dj: e.target.checked })}
                className="w-5 h-5"
              />
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${formData.pagado_dj ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">Pagado DJ</span>
              </div>
            </label>
          </div>

          {/* Observaciones */}
          <Textarea
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
            rows={3}
            placeholder="Notas adicionales..."
            fullWidth
          />

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 btn btn-primary"
            >
              {evento ? 'Actualizar' : 'Crear'} Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal de Vista de Evento
const EventoViewModal = ({ evento, onClose }) => {
  if (!evento) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-white/20">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {evento.evento}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Detalles básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{evento.fecha}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Horario</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">
                    {evento.hora_inicio || '--:--'} - {evento.hora_fin || '--:--'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">DJ</label>
                <div className="flex items-center gap-2 mt-1">
                  <Music className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{evento.dj_nombre || 'Sin DJ'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Cliente</label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{evento.cliente || 'Sin cliente'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Ubicación</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">{evento.ciudad_lugar || 'No especificada'}</span>
                </div>
              </div>

              {evento.categoria && (
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Categoría</label>
                  <div className="mt-1">
                    <span className="inline-block px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                      {evento.categoria}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estados */}
          <div className="flex gap-3">
            <div className={`flex-1 p-3 rounded-lg border ${
              evento.cobrado_cliente
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-white/20'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${evento.cobrado_cliente ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {evento.cobrado_cliente ? 'Cobrado' : 'Pendiente de cobro'}
                </span>
              </div>
            </div>

            <div className={`flex-1 p-3 rounded-lg border ${
              evento.pagado_dj
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-white/20'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${evento.pagado_dj ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="font-medium text-sm">
                  {evento.pagado_dj ? 'DJ Pagado' : 'Pendiente de pagar DJ'}
                </span>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          {evento.observaciones && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                Observaciones
              </label>
              <p className="text-gray-900 dark:text-white text-sm">{evento.observaciones}</p>
            </div>
          )}

          {/* Financial Breakdown */}
          <FinancialBreakdown eventoId={evento.id} />
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-white/20">
          <button
            onClick={onClose}
            className="flex-1 btn btn-secondary"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Card de Evento (vista móvil)
const EventoCard = ({ evento, onEdit, onToggle, onView }) => (
  <div className="card hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <h3 className="font-bold text-gray-900 dark:text-white">{evento.evento}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
          <Calendar className="w-4 h-4" />
          <span>{evento.fecha}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onView(evento)}
          className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </button>
        <button
          onClick={() => onEdit(evento)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Editar"
        >
          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Music className="w-4 h-4" />
        <span>{evento.dj_nombre || 'Sin DJ'}</span>
      </div>

      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <Building2 className="w-4 h-4" />
        <span>{evento.cliente_nombre || evento.cliente || 'Sin cliente'}</span>
      </div>

      {evento.ciudad_lugar && (
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <MapPin className="w-4 h-4" />
          <span>{evento.ciudad_lugar}</span>
        </div>
      )}
    </div>

    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Caché Total</span>
        <span className="font-bold text-lg text-green-600">
          €{parseFloat(evento.cache_total || 0).toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="text-gray-600 dark:text-gray-400">
          DJ: €{parseFloat(evento.parte_dj || 0).toFixed(2)}
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          Agencia: €{parseFloat(evento.parte_agencia || 0).toFixed(2)}
        </div>
      </div>
    </div>

    <div className="mt-3 flex gap-2">
      <button
        onClick={() => onToggle(evento.id, 'cobrado_cliente', evento.cobrado_cliente)}
        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
          evento.cobrado_cliente
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400'
        }`}
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Cobrado</span>
      </button>

      <button
        onClick={() => onToggle(evento.id, 'pagado_dj', evento.pagado_dj)}
        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border transition-colors ${
          evento.pagado_dj
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-400'
        }`}
      >
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Pagado</span>
      </button>
    </div>

    {evento.categoria && (
      <div className="mt-2">
        <span className="inline-block px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
          {evento.categoria}
        </span>
      </div>
    )}
  </div>
);

// Componente Principal
const Eventos = () => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    mes: '',
    cobrado: '',
    pagado: '',
    categoria: ''
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState(null);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [viewingEvento, setViewingEvento] = useState(null);

  useEffect(() => {
    loadEventos();
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const res = await eventosAPI.getAll();
      setEventos(res.data.data || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const togglePagado = async (id, field, currentValue) => {
    try {
      const updateData = { [field]: !currentValue };
      await eventosAPI.update(id, updateData);
      toast.success('Estado actualizado');
      loadEventos();
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error al actualizar');
    }
  };

  const handleEdit = (evento) => {
    setEditingEvento(evento);
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingEvento(null);
  };

  const handleSave = () => {
    loadEventos();
  };

  const handleView = (evento) => {
    setViewingEvento(evento);
  };

  const handleCloseView = () => {
    setViewingEvento(null);
  };

  // Filtrado de eventos
  const filteredEventos = useMemo(() => {
    return eventos.filter(evento => {
      // Búsqueda por texto
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        evento.evento?.toLowerCase().includes(searchLower) ||
        evento.dj_nombre?.toLowerCase().includes(searchLower) ||
        evento.cliente?.toLowerCase().includes(searchLower) ||
        evento.ciudad_lugar?.toLowerCase().includes(searchLower);

      // Filtro por mes (extraer mes de la fecha)
      const matchesMes = !filters.mes || evento.fecha?.includes(filters.mes);

      // Filtro por cobrado
      const matchesCobrado = filters.cobrado === '' ||
        (filters.cobrado === 'true' ? evento.cobrado_cliente : !evento.cobrado_cliente);

      // Filtro por pagado DJ
      const matchesPagado = filters.pagado === '' ||
        (filters.pagado === 'true' ? evento.pagado_dj : !evento.pagado_dj);

      // Filtro por categoría
      const matchesCategoria = !filters.categoria || evento.categoria === filters.categoria;

      return matchesSearch && matchesMes && matchesCobrado && matchesPagado && matchesCategoria;
    });
  }, [eventos, searchTerm, filters]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Eventos</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            {filteredEventos.length} de {eventos.length} eventos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <ExportButton
            datos={filteredEventos}
            nombreArchivo={`eventos-${new Date().toISOString().split('T')[0]}`}
            label="Exportar"
            className="w-full sm:w-auto"
          />
          <button
            onClick={() => setShowFormModal(true)}
            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Nuevo Evento
          </button>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="space-y-3">
        {/* Barra de búsqueda */}
        <Input
          type="text"
          placeholder="Buscar evento, DJ, cliente, ciudad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={Search}
          fullWidth
        />

        {/* Filtros rápidos móvil-friendly */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.cobrado}
            onChange={(e) => setFilters({ ...filters, cobrado: e.target.value })}
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Cobrados' },
              { value: 'false', label: 'Sin cobrar' }
            ]}
            size="sm"
            className="flex-1 min-w-[120px]"
          />

          <Select
            value={filters.pagado}
            onChange={(e) => setFilters({ ...filters, pagado: e.target.value })}
            options={[
              { value: '', label: 'Todos' },
              { value: 'true', label: 'Pagados' },
              { value: 'false', label: 'Sin pagar' }
            ]}
            size="sm"
            className="flex-1 min-w-[120px]"
          />

          <Select
            value={filters.categoria}
            onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
            options={[
              { value: '', label: 'Todas las categorías' },
              { value: 'Boda', label: 'Boda' },
              { value: 'Cumpleaños', label: 'Cumpleaños' },
              { value: 'Discoteca', label: 'Discoteca' },
              { value: 'Corporativo', label: 'Corporativo' },
              { value: 'Festival', label: 'Festival' },
              { value: 'Privado', label: 'Privado' },
              { value: 'Otro', label: 'Otro' }
            ]}
            size="sm"
            className="flex-1 min-w-[120px]"
          />
        </div>
      </div>

      {/* Vista de Eventos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredEventos.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm || Object.values(filters).some(f => f) ? 'No se encontraron eventos' : 'No hay eventos'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || Object.values(filters).some(f => f)
              ? 'Prueba con otros filtros'
              : 'Crea tu primer evento para comenzar'}
          </p>
        </div>
      ) : (
        <>
          {/* Vista Cards (Mobile-first) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEventos.map(evento => (
              <EventoCard
                key={evento.id}
                evento={evento}
                onEdit={handleEdit}
                onToggle={togglePagado}
                onView={handleView}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal de Formulario */}
      {showFormModal && (
        <EventoFormModal
          evento={editingEvento}
          onClose={handleCloseForm}
          onSave={handleSave}
        />
      )}

      {/* Modal de Vista */}
      {viewingEvento && (
        <EventoViewModal
          evento={viewingEvento}
          onClose={handleCloseView}
        />
      )}
    </div>
  );
};

export default Eventos;
