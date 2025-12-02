import { useState, useEffect } from 'react';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Breadcrumbs from '../components/Breadcrumbs';
import EquipmentStats from '../components/EquipmentStats';
import EquipmentList from '../components/EquipmentList';
import EquipmentForm from '../components/EquipmentForm';
import toast from '../utils/toast';
import {
  getEquipment,
  getEquipmentStats,
  deleteEquipment,
  getEquipmentTypes,
  getEquipmentStatus
} from '../services/equipmentService';

/**
 * Equipment Management Page
 * Main page for managing agency equipment inventory
 */
const Equipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    tipo: '',
    estado: '',
    solo_disponibles: false
  });

  // Load data
  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getEquipment(filters);
      setEquipment(response.data || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
      toast.error('Error al cargar equipos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getEquipmentStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreate = () => {
    setSelectedEquipment(null);
    setIsFormOpen(true);
  };

  const handleEdit = (equip) => {
    setSelectedEquipment(equip);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este equipo?')) {
      return;
    }

    try {
      await deleteEquipment(id);
      toast.success('Equipo eliminado exitosamente');
      loadData();
      loadStats();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast.error('Error al eliminar equipo');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedEquipment(null);
    loadData();
    loadStats();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      tipo: '',
      estado: '',
      solo_disponibles: false
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumbs />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            Gestión de Equipos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Administra el inventario de equipos de tu agencia
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuevo Equipo
          </button>
        </div>
      </div>

      {/* Statistics */}
      <EquipmentStats stats={stats} />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Equipo
            </label>
            <select
              value={filters.tipo}
              onChange={(e) => handleFilterChange('tipo', e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los tipos</option>
              {getEquipmentTypes().map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los estados</option>
              {getEquipmentStatus().map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.solo_disponibles}
                onChange={(e) => handleFilterChange('solo_disponibles', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Solo disponibles
              </span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <EquipmentList
        equipment={equipment}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Equipment Form Modal */}
      <EquipmentForm
        isOpen={isFormOpen}
        equipment={selectedEquipment}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Equipment;
