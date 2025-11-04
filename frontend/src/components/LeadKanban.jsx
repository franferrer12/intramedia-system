import { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Mail, Phone, Calendar, DollarSign, Users, Eye, CheckCircle, XCircle, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

/**
 * Tarjeta de Lead arrastrable
 */
const LeadCard = ({ lead, onView, onConvert, onMarkPerdido, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 rounded-lg p-4 mb-3
        border border-gray-200 dark:border-gray-700
        shadow-sm hover:shadow-md
        transition-all duration-200
        cursor-grab active:cursor-grabbing
        ${isOverlay ? 'rotate-2 scale-105' : ''}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Nombre y empresa */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
          {lead.nombre}
        </h3>
        {lead.empresa && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Building2 className="w-3 h-3" />
            <span>{lead.empresa}</span>
          </div>
        )}
      </div>

      {/* Info de contacto */}
      <div className="space-y-1.5 mb-3">
        {lead.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.telefono && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>{lead.telefono}</span>
          </div>
        )}
      </div>

      {/* Info del evento */}
      {(lead.tipo_evento || lead.fecha_evento) && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
          {lead.tipo_evento && (
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400">
              {lead.tipo_evento}
            </div>
          )}
          {lead.fecha_evento && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{new Date(lead.fecha_evento).toLocaleDateString('es-ES')}</span>
            </div>
          )}
          {lead.presupuesto_estimado && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <DollarSign className="w-3 h-3" />
              <span>{parseFloat(lead.presupuesto_estimado).toLocaleString('es-ES')}€</span>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(lead);
          }}
          className="flex-1 py-1.5 px-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center justify-center gap-1"
          title="Ver detalles"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver
        </button>

        {lead.estado !== 'ganado' && lead.estado !== 'perdido' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConvert(lead);
              }}
              className="flex-1 py-1.5 px-2 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors flex items-center justify-center gap-1"
              title="Convertir a cliente"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Cliente
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkPerdido(lead);
              }}
              className="py-1.5 px-2 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Marcar como perdido"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

/**
 * Columna de Kanban
 */
const KanbanColumn = ({ title, leads, estado, color }) => {
  const { setNodeRef } = useSortable({
    id: `column-${estado}`,
    data: { type: 'column', estado }
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 min-h-[600px] flex flex-col"
    >
      {/* Header de columna */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {title}
          </h3>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
          {leads.length}
        </span>
      </div>

      {/* Lista de leads */}
      <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto space-y-3">
          {leads.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              No hay leads aquí
            </div>
          ) : (
            leads.map(lead => <LeadCard key={lead.id} lead={lead} {...lead._handlers} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
};

/**
 * Componente principal LeadKanban
 */
const LeadKanban = ({ leads, onUpdate, onView, onConvert, onMarkPerdido }) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Agrupar leads por estado
  const leadsByEstado = {
    nuevo: [],
    contactado: [],
    propuesta: [],
    ganado: [],
    perdido: []
  };

  leads.forEach(lead => {
    const leadWithHandlers = {
      ...lead,
      _handlers: {
        onView,
        onConvert,
        onMarkPerdido
      }
    };
    if (leadsByEstado[lead.estado]) {
      leadsByEstado[lead.estado].push(leadWithHandlers);
    }
  });

  const columns = [
    { id: 'nuevo', title: 'Nuevos', color: 'bg-blue-500', estado: 'nuevo' },
    { id: 'contactado', title: 'Contactados', color: 'bg-purple-500', estado: 'contactado' },
    { id: 'propuesta', title: 'Propuestas', color: 'bg-orange-500', estado: 'propuesta' },
    { id: 'ganado', title: 'Ganados', color: 'bg-green-500', estado: 'ganado' },
    { id: 'perdido', title: 'Perdidos', color: 'bg-red-500', estado: 'perdido' },
  ];

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Si se suelta sobre una columna
    if (overId.toString().startsWith('column-')) {
      return;
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) return;

    const leadId = active.id;
    const lead = leads.find(l => l.id === leadId);

    if (!lead) return;

    // Determinar el nuevo estado
    let nuevoEstado = null;

    // Si se suelta sobre una columna
    if (over.id.toString().startsWith('column-')) {
      nuevoEstado = over.id.replace('column-', '');
    }
    // Si se suelta sobre otro lead
    else {
      const overLead = leads.find(l => l.id === over.id);
      if (overLead) {
        nuevoEstado = overLead.estado;
      }
    }

    // Si el estado cambió, actualizar en backend
    if (nuevoEstado && nuevoEstado !== lead.estado) {
      try {
        const token = localStorage.getItem('auth_token');
        await axios.patch(
          `${API_URL}/leads/${leadId}/estado`,
          { estado: nuevoEstado },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success(`Lead movido a "${nuevoEstado}"`);
        onUpdate(); // Refrescar datos
      } catch (error) {
        console.error('Error al actualizar estado:', error);
        toast.error('Error al mover el lead');
      }
    }
  };

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            leads={leadsByEstado[column.estado]}
            estado={column.estado}
            color={column.color}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <LeadCard lead={activeLead} onView={() => {}} onConvert={() => {}} onMarkPerdido={() => {}} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default LeadKanban;
