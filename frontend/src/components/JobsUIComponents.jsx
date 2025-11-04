/**
 * 🍎 Jobs-Style UI Components
 * Componentes React minimalistas y elegantes
 */

import React, { useState } from 'react';
import '../styles/jobs-design-system.css';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUTTON COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  onClick
}) => {
  const className = `btn btn-${variant} btn-${size}`;

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <span className="animate-spin">⟳</span>}
      {icon && !loading && <span>{icon}</span>}
      {!icon && !loading && children}
    </button>
  );
};

// Ejemplo de uso:
// <Button variant="primary">Guardar</Button>
// <Button variant="ghost" icon="✓">Marcar pagado</Button>
// <Button loading>Procesando...</Button>

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INPUT COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Input = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  success,
  disabled,
  icon
}) => {
  const className = `input ${error ? 'input-error' : ''} ${success ? 'input-success' : ''}`;

  return (
    <div className="input-wrapper">
      <input
        type={type}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <div className="input-error-message">{error}</div>}
      {success && <div className="input-success-icon">✓</div>}
    </div>
  );
};

// Ejemplo:
// <Input placeholder="Buscar..." error="Campo requerido" />
// <Input value={name} onChange={e => setName(e.target.value)} success />

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CARD COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Card = ({
  title,
  subtitle,
  children,
  interactive,
  onClick
}) => {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="card-header">
          {title && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

// Ejemplo:
// <Card title="Evento" subtitle="Hoy">
//   <p>Fiesta Club X</p>
// </Card>

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOAST COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Toast = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, type === 'error' ? 3000 : 2000);
    return () => clearTimeout(timer);
  }, [type, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
};

// Sistema de toast global
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const show = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const remove = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return {
    toasts,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
    remove
  };
};

// Ejemplo:
// const toast = useToast();
// toast.success('Guardado');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODAL COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Modal = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Ejemplo:
// <Modal isOpen={open} onClose={close} title="Nuevo Evento">
//   <form>...</form>
// </Modal>

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPTY STATE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EmptyState = ({
  icon,
  title,
  subtitle,
  action,
  onAction
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {subtitle && <p className="empty-state-subtitle">{subtitle}</p>}
      {action && (
        <Button variant="primary" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
};

// Ejemplo:
// <EmptyState
//   icon="📅"
//   title="Sin eventos"
//   subtitle="Crea tu primer evento"
//   action="Crear evento"
//   onAction={handleCreate}
// />

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SKELETON LOADING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Skeleton = ({ type = 'text', count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-${type}`} />
      ))}
    </>
  );
};

// Ejemplo:
// <Skeleton type="title" />
// <Skeleton type="text" count={3} />

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BADGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Badge = ({ children, type = 'info' }) => {
  return (
    <span className={`badge badge-${type}`}>
      {children}
    </span>
  );
};

// Ejemplo:
// <Badge type="success">Pagado</Badge>
// <Badge type="danger">Pendiente</Badge>

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// KPI CARD (Dashboard)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const KPICard = ({ value, label, trend }) => {
  return (
    <Card>
      <div className="display">{value}</div>
      <div className="caption" style={{ marginTop: '8px' }}>
        {label}
        {trend && (
          <span className={`text-${trend > 0 ? 'success' : 'danger'}`}>
            {' '}{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </Card>
  );
};

// Ejemplo:
// <KPICard value="15" label="Eventos" trend={12} />

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEARCH BAR (Smart)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SearchBar = ({
  onSearch,
  placeholder = 'Buscar...',
  debounce = 300
}) => {
  const [value, setValue] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length >= 2) {
        onSearch(value);
      }
    }, debounce);

    return () => clearTimeout(timer);
  }, [value, onSearch, debounce]);

  return (
    <input
      type="search"
      className="input input-search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

// Ejemplo:
// <SearchBar onSearch={handleSearch} />

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EVENT CARD (Ejemplo específico)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EventCard = ({
  event,
  onMarkPaid,
  onDelete
}) => {
  return (
    <Card interactive>
      <div className="flex justify-between items-center">
        <div>
          <div className="title">{event.hora} • {event.lugar}</div>
          <div className="caption" style={{ marginTop: '4px' }}>
            {event.dj} • €{event.precio}
          </div>
        </div>
        <div className="flex gap-sm">
          {!event.pagado && (
            <Button
              variant="ghost"
              size="sm"
              icon="✓"
              onClick={() => onMarkPaid(event.id)}
            />
          )}
          {event.pagado && <Badge type="success">Pagado</Badge>}
        </div>
      </div>
    </Card>
  );
};

// Ejemplo de uso en Dashboard:
// <EventCard
//   event={{ hora: '20:00', lugar: 'Club Pacha', dj: 'DJ Martin', precio: 600 }}
//   onMarkPaid={handleMarkPaid}
// />

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIMPLE FORM (Quick create)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QuickEventForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '20:00',
    dj_id: '',
    cliente_id: '',
    precio: 500
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md">
      <div>
        <label className="caption">Cuándo</label>
        <Input
          type="date"
          value={formData.fecha}
          onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
        />
      </div>

      <div>
        <label className="caption">DJ</label>
        <select
          className="input"
          value={formData.dj_id}
          onChange={e => setFormData(prev => ({ ...prev, dj_id: e.target.value }))}
        >
          <option value="">Seleccionar DJ</option>
          <option value="1">DJ Martin</option>
          <option value="2">DJ Cele</option>
        </select>
      </div>

      <div>
        <label className="caption">Precio</label>
        <Input
          type="number"
          value={formData.precio}
          onChange={e => setFormData(prev => ({ ...prev, precio: e.target.value }))}
        />
      </div>

      <div className="flex gap-sm justify-between">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          Crear
        </Button>
      </div>
    </form>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD LAYOUT (Example)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();

  const handleCreateEvent = (data) => {
    // API call aquí
    toast.success('Creado');
    setIsModalOpen(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '32px' }}>
        <h1 className="display">Hoy</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Nuevo
        </Button>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <KPICard value="3" label="Eventos" trend={12} />
        <KPICard value="€2,400" label="Ingresos" trend={-5} />
      </div>

      {/* Events List */}
      <div>
        <h2 className="headline" style={{ marginBottom: '16px' }}>
          Próximos Eventos
        </h2>

        <div className="flex flex-col gap-md">
          <EventCard
            event={{
              id: 1,
              hora: '20:00',
              lugar: 'Club Pacha',
              dj: 'DJ Martin',
              precio: 600,
              pagado: false
            }}
            onMarkPaid={() => toast.success('Marcado como pagado')}
          />
          <EventCard
            event={{
              id: 2,
              hora: '23:00',
              lugar: 'Sala Apolo',
              dj: 'DJ Cele',
              precio: 450,
              pagado: true
            }}
          />
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nuevo Evento"
      >
        <QuickEventForm
          onSubmit={handleCreateEvent}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Toasts */}
      {toast.toasts.map(t => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => toast.remove(t.id)}
        />
      ))}
    </div>
  );
};

export default Dashboard;
