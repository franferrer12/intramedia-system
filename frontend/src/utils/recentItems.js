/**
 * Recent Items Utility
 * Manages recently viewed items in localStorage for quick access
 */

const STORAGE_KEY = 'recentItems';
const MAX_ITEMS_PER_TYPE = 5;
const MAX_TOTAL_ITEMS = 20;

/**
 * Get all recent items from localStorage
 */
export const getRecentItems = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading recent items:', error);
    return [];
  }
};

/**
 * Add an item to recent items
 * @param {string} type - Type of entity (evento, dj, cliente, lead)
 * @param {object} item - Item data
 */
export const addRecentItem = (type, item) => {
  try {
    const recent = getRecentItems();

    // Create recent item object
    const recentItem = {
      type,
      id: item.id,
      data: extractRelevantData(type, item),
      timestamp: Date.now(),
    };

    // Remove duplicate if exists
    const filtered = recent.filter(
      r => !(r.type === type && r.id === item.id)
    );

    // Add to beginning
    const updated = [recentItem, ...filtered];

    // Limit items per type
    const byType = {};
    updated.forEach(item => {
      byType[item.type] = byType[item.type] || [];
      if (byType[item.type].length < MAX_ITEMS_PER_TYPE) {
        byType[item.type].push(item);
      }
    });

    // Flatten and limit total
    const limited = Object.values(byType)
      .flat()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_TOTAL_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));

    // Dispatch event for components to update
    window.dispatchEvent(new CustomEvent('recent-items-updated'));

    return limited;
  } catch (error) {
    console.error('Error adding recent item:', error);
    return getRecentItems();
  }
};

/**
 * Remove an item from recent items
 */
export const removeRecentItem = (type, id) => {
  try {
    const recent = getRecentItems();
    const filtered = recent.filter(
      item => !(item.type === type && item.id === id)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('recent-items-updated'));
    return filtered;
  } catch (error) {
    console.error('Error removing recent item:', error);
    return getRecentItems();
  }
};

/**
 * Clear all recent items
 */
export const clearRecentItems = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('recent-items-updated'));
    return [];
  } catch (error) {
    console.error('Error clearing recent items:', error);
    return [];
  }
};

/**
 * Get recent items by type
 */
export const getRecentItemsByType = (type) => {
  const recent = getRecentItems();
  return recent.filter(item => item.type === type);
};

/**
 * Extract relevant data for display
 */
const extractRelevantData = (type, item) => {
  switch (type) {
    case 'evento':
      return {
        id: item.id,
        evento: item.evento,
        fecha: item.fecha,
        ubicacion: item.ubicacion,
        dj_nombre: item.dj_nombre,
        cliente_nombre: item.cliente_nombre,
        status: item.status,
      };

    case 'dj':
      return {
        id: item.id,
        nombre: item.nombre,
        nombre_artistico: item.nombre_artistico,
        email: item.email,
        telefono: item.telefono,
        especialidad: item.especialidad,
      };

    case 'cliente':
      return {
        id: item.id,
        nombre: item.nombre,
        email: item.email,
        telefono: item.telefono,
        empresa: item.empresa,
        tipo_cliente: item.tipo_cliente,
      };

    case 'lead':
      return {
        id: item.id,
        nombre: item.nombre,
        email: item.email,
        telefono: item.telefono,
        status: item.status,
        score: item.score,
        tipo_evento: item.tipo_evento,
      };

    default:
      return item;
  }
};

/**
 * Format recent item for display
 */
export const formatRecentItem = (recentItem) => {
  const { type, data } = recentItem;

  switch (type) {
    case 'evento':
      return {
        title: data.evento,
        subtitle: data.ubicacion || new Date(data.fecha).toLocaleDateString('es-ES'),
        badge: data.status,
      };

    case 'dj':
      return {
        title: data.nombre_artistico || data.nombre,
        subtitle: data.especialidad || data.email,
        badge: 'DJ',
      };

    case 'cliente':
      return {
        title: data.nombre,
        subtitle: data.empresa || data.email,
        badge: data.tipo_cliente || 'Cliente',
      };

    case 'lead':
      return {
        title: data.nombre,
        subtitle: data.tipo_evento || data.email,
        badge: data.status,
      };

    default:
      return {
        title: 'Unknown',
        subtitle: '',
        badge: '',
      };
  }
};

/**
 * Get path for recent item
 */
export const getRecentItemPath = (recentItem) => {
  const { type, id } = recentItem;

  const paths = {
    evento: '/eventos',
    dj: '/djs',
    cliente: '/clientes',
    lead: '/leads',
  };

  return `${paths[type]}?id=${id}`;
};

/**
 * Get icon name for recent item type
 */
export const getRecentItemIcon = (type) => {
  const icons = {
    evento: 'calendar',
    dj: 'musical-note',
    cliente: 'user',
    lead: 'user-group',
  };

  return icons[type] || 'document';
};

/**
 * Get readable type name
 */
export const getRecentItemTypeName = (type) => {
  const names = {
    evento: 'Evento',
    dj: 'DJ',
    cliente: 'Cliente',
    lead: 'Lead',
  };

  return names[type] || type;
};
