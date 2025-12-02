import api from './api';

/**
 * Equipment Service
 * API calls for equipment management
 */

// ============================================================================
// EQUIPMENT ENDPOINTS
// ============================================================================

/**
 * Get all equipment for agency
 * @param {Object} filters - Optional filters (tipo, estado, solo_disponibles)
 * @returns {Promise<Object>} Equipment list with count
 */
export const getEquipment = async (filters = {}) => {
  const response = await api.get('/equipment', { params: filters });
  return response.data;
};

/**
 * Get equipment by ID
 * @param {number} id - Equipment ID
 * @returns {Promise<Object>} Equipment details with availability
 */
export const getEquipmentById = async (id) => {
  const response = await api.get(`/equipment/${id}`);
  return response.data;
};

/**
 * Create new equipment
 * @param {Object} equipmentData - Equipment data
 * @returns {Promise<Object>} Created equipment
 */
export const createEquipment = async (equipmentData) => {
  const response = await api.post('/equipment', equipmentData);
  return response.data;
};

/**
 * Update equipment
 * @param {number} id - Equipment ID
 * @param {Object} equipmentData - Updated equipment data
 * @returns {Promise<Object>} Updated equipment
 */
export const updateEquipment = async (id, equipmentData) => {
  const response = await api.put(`/equipment/${id}`, equipmentData);
  return response.data;
};

/**
 * Delete equipment (soft delete)
 * @param {number} id - Equipment ID
 * @returns {Promise<Object>} Deleted equipment
 */
export const deleteEquipment = async (id) => {
  const response = await api.delete(`/equipment/${id}`);
  return response.data;
};

/**
 * Get equipment statistics
 * @returns {Promise<Object>} Equipment stats
 */
export const getEquipmentStats = async () => {
  const response = await api.get('/equipment/stats');
  return response.data;
};

/**
 * Check equipment availability for date range
 * @param {number} id - Equipment ID
 * @param {string} fecha_inicio - Start date (YYYY-MM-DD)
 * @param {string} fecha_fin - End date (YYYY-MM-DD)
 * @param {number} cantidad - Quantity needed
 * @returns {Promise<Object>} Availability info
 */
export const checkAvailability = async (id, fecha_inicio, fecha_fin, cantidad = 1) => {
  const response = await api.post(`/equipment/${id}/check-availability`, {
    fecha_inicio,
    fecha_fin,
    cantidad
  });
  return response.data;
};

/**
 * Get rentals for specific equipment
 * @param {number} id - Equipment ID
 * @param {string} estado - Optional rental status filter
 * @returns {Promise<Object>} Rentals list
 */
export const getEquipmentRentals = async (id, estado = null) => {
  const params = estado ? { estado } : {};
  const response = await api.get(`/equipment/${id}/rentals`, { params });
  return response.data;
};

// ============================================================================
// RENTAL ENDPOINTS
// ============================================================================

/**
 * Get all rentals (admin view)
 * @param {Object} filters - Optional filters (estado, fecha_inicio, fecha_fin)
 * @returns {Promise<Object>} All rentals with details
 */
export const getAllRentals = async (filters = {}) => {
  const response = await api.get('/equipment/rentals/all', { params: filters });
  return response.data;
};

/**
 * Create new equipment rental
 * @param {Object} rentalData - Rental data
 * @returns {Promise<Object>} Created rental
 */
export const createRental = async (rentalData) => {
  const response = await api.post('/equipment/rentals', rentalData);
  return response.data;
};

/**
 * Mark rental as delivered
 * @param {number} id - Rental ID
 * @returns {Promise<Object>} Updated rental
 */
export const markAsDelivered = async (id) => {
  const response = await api.post(`/equipment/rentals/${id}/deliver`);
  return response.data;
};

/**
 * Mark rental as returned
 * @param {number} id - Rental ID
 * @param {string} condicion - Condition (excelente, bueno, regular, dañado)
 * @returns {Promise<Object>} Updated rental
 */
export const markAsReturned = async (id, condicion) => {
  const response = await api.post(`/equipment/rentals/${id}/return`, { condicion });
  return response.data;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get equipment types
 * @returns {Array} Equipment type options
 */
export const getEquipmentTypes = () => [
  { value: 'mixer', label: 'Mixer' },
  { value: 'speaker', label: 'Altavoz/Speaker' },
  { value: 'subwoofer', label: 'Subwoofer' },
  { value: 'dj_controller', label: 'Controlador DJ' },
  { value: 'turntable', label: 'Tornamesa' },
  { value: 'microphone', label: 'Micrófono' },
  { value: 'lights', label: 'Luces' },
  { value: 'laser', label: 'Láser' },
  { value: 'smoke_machine', label: 'Máquina de Humo' },
  { value: 'cable', label: 'Cable' },
  { value: 'stand', label: 'Soporte/Stand' },
  { value: 'amplifier', label: 'Amplificador' },
  { value: 'headphones', label: 'Audífonos' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'other', label: 'Otro' }
];

/**
 * Get equipment status options
 * @returns {Array} Status options
 */
export const getEquipmentStatus = () => [
  { value: 'disponible', label: 'Disponible', color: 'green' },
  { value: 'alquilado', label: 'Alquilado', color: 'blue' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: 'yellow' },
  { value: 'dañado', label: 'Dañado', color: 'red' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio', color: 'gray' }
];

/**
 * Get rental status options
 * @returns {Array} Rental status options
 */
export const getRentalStatus = () => [
  { value: 'reservado', label: 'Reservado', color: 'blue' },
  { value: 'entregado', label: 'Entregado', color: 'yellow' },
  { value: 'devuelto', label: 'Devuelto', color: 'green' },
  { value: 'cancelado', label: 'Cancelado', color: 'red' }
];

/**
 * Get condition options
 * @returns {Array} Condition options
 */
export const getConditionOptions = () => [
  { value: 'excelente', label: 'Excelente', color: 'green' },
  { value: 'bueno', label: 'Bueno', color: 'blue' },
  { value: 'regular', label: 'Regular', color: 'yellow' },
  { value: 'dañado', label: 'Dañado', color: 'red' }
];

/**
 * Format equipment type label
 * @param {string} tipo - Equipment type value
 * @returns {string} Formatted label
 */
export const formatEquipmentType = (tipo) => {
  const types = getEquipmentTypes();
  const found = types.find(t => t.value === tipo);
  return found ? found.label : tipo;
};

/**
 * Get status color class
 * @param {string} estado - Status value
 * @returns {string} Tailwind color classes
 */
export const getStatusColorClass = (estado) => {
  const status = getEquipmentStatus();
  const found = status.find(s => s.value === estado);
  const color = found?.color || 'gray';

  const colorMap = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
  };

  return colorMap[color];
};

export default {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentStats,
  checkAvailability,
  getEquipmentRentals,
  getAllRentals,
  createRental,
  markAsDelivered,
  markAsReturned,
  getEquipmentTypes,
  getEquipmentStatus,
  getRentalStatus,
  getConditionOptions,
  formatEquipmentType,
  getStatusColorClass
};
