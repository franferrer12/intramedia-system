import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit,
  Search,
  X,
  Check,
  TrendingUp,
  Calendar,
  Percent,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

/**
 * Agency DJ Management Component
 * Allows agencies to manage their roster of DJs
 */
const AgencyDJManagement = () => {
  // State
  const [activeTab, setActiveTab] = useState('my-djs'); // 'my-djs' or 'available-djs'
  const [myDJs, setMyDJs] = useState([]);
  const [availableDJs, setAvailableDJs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDJ, setSelectedDJ] = useState(null);
  const [formData, setFormData] = useState({
    role: 'managed',
    commissionRate: 15,
    contractStartDate: '',
    contractEndDate: ''
  });

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || '';
  };

  // Fetch DJs on mount and tab change
  useEffect(() => {
    if (activeTab === 'my-djs') {
      fetchMyDJs();
    } else {
      fetchAvailableDJs();
    }
  }, [activeTab]);

  // Fetch agency's DJs
  const fetchMyDJs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3001/api/agencies/djs', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setMyDJs(response.data.djs || []);
    } catch (err) {
      console.error('Error fetching DJs:', err);
      setError(err.response?.data?.error || 'Error al cargar artistas');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available DJs (not assigned to any agency)
  const fetchAvailableDJs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:3001/api/agencies/available-djs', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAvailableDJs(response.data.djs || []);
    } catch (err) {
      console.error('Error fetching available DJs:', err);
      setError(err.response?.data?.error || 'Error al cargar artistas disponibles');
    } finally {
      setLoading(false);
    }
  };

  // Open add DJ modal
  const handleAddDJ = (dj) => {
    setSelectedDJ(dj);
    setFormData({
      role: 'managed',
      commissionRate: 15,
      contractStartDate: new Date().toISOString().split('T')[0],
      contractEndDate: ''
    });
    setShowAddModal(true);
  };

  // Submit add DJ
  const handleSubmitAdd = async () => {
    if (!selectedDJ) return;

    setLoading(true);
    try {
      await axios.post(
        'http://localhost:3001/api/agencies/djs',
        {
          djId: selectedDJ.id,
          role: formData.role,
          commissionRate: parseFloat(formData.commissionRate),
          contractStartDate: formData.contractStartDate,
          contractEndDate: formData.contractEndDate || null
        },
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` }
        }
      );

      setShowAddModal(false);
      setSelectedDJ(null);
      fetchAvailableDJs(); // Refresh available DJs

      // Switch to my-djs tab and refresh
      setActiveTab('my-djs');
      fetchMyDJs();

      alert(`${selectedDJ.nombre} ha sido añadido exitosamente`);
    } catch (err) {
      console.error('Error adding DJ:', err);
      alert(err.response?.data?.error || 'Error al añadir artista');
    } finally {
      setLoading(false);
    }
  };

  // Remove DJ from agency
  const handleRemoveDJ = async (dj) => {
    if (!confirm(`¿Estás seguro de que deseas remover a ${dj.nombre} de tu agencia?`)) {
      return;
    }

    setLoading(true);
    try {
      await axios.delete(`http://localhost:3001/api/agencies/djs/${dj.id}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });

      alert(`${dj.nombre} ha sido removido exitosamente`);
      fetchMyDJs(); // Refresh my DJs
    } catch (err) {
      console.error('Error removing DJ:', err);
      alert(err.response?.data?.error || 'Error al remover artista');
    } finally {
      setLoading(false);
    }
  };

  // Filter DJs based on search term
  const filterDJs = (djs) => {
    if (!searchTerm) return djs;
    return djs.filter(dj =>
      dj.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dj.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return parseInt(num).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Gestión de Artistas
              </h1>
              <p className="text-gray-600">
                Administra tu roster de artistas y añade nuevos talentos a tu agencia
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('my-djs')}
              className={`pb-4 px-4 font-medium transition-colors relative ${
                activeTab === 'my-djs'
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5" />
                <span>Mis Artistas</span>
                <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-bold">
                  {myDJs.length}
                </span>
              </div>
              {activeTab === 'my-djs' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('available-djs')}
              className={`pb-4 px-4 font-medium transition-colors relative ${
                activeTab === 'available-djs'
                  ? 'text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Artistas Disponibles</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                  {availableDJs.length}
                </span>
              </div>
              {activeTab === 'available-djs' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar artista por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Cargando...</p>
          </div>
        )}

        {/* My DJs Tab */}
        {!loading && activeTab === 'my-djs' && (
          <>
            {filterDJs(myDJs).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {searchTerm
                    ? 'No se encontraron artistas con ese criterio'
                    : 'Aún no tienes artistas en tu agencia'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => setActiveTab('available-djs')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-shadow"
                  >
                    Explorar Artistas Disponibles
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterDJs(myDJs).map((dj) => (
                  <div
                    key={dj.id}
                    className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {dj.nombre?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{dj.nombre}</h3>
                          <p className="text-sm text-gray-500">{dj.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-600 font-medium">Eventos</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatNumber(dj.total_events)}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600 font-medium">Ingresos</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          €{formatNumber(dj.total_revenue)}
                        </p>
                      </div>
                    </div>

                    {/* Commission */}
                    {dj.commission_rate && (
                      <div className="bg-purple-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Percent className="w-4 h-4 text-purple-600" />
                            <span className="text-sm text-purple-600 font-medium">Comisión</span>
                          </div>
                          <span className="text-lg font-bold text-purple-600">
                            {dj.commission_rate}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRemoveDJ(dj)}
                        className="flex-1 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Available DJs Tab */}
        {!loading && activeTab === 'available-djs' && (
          <>
            {filterDJs(availableDJs).length === 0 ? (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm
                    ? 'No se encontraron artistas disponibles con ese criterio'
                    : 'No hay artistas disponibles en este momento'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterDJs(availableDJs).map((dj) => (
                  <div
                    key={dj.id}
                    className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {dj.nombre?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-800">{dj.nombre}</h3>
                          <p className="text-sm text-gray-500">{dj.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-xs text-gray-600 font-medium">Eventos Totales</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatNumber(dj.total_events)}
                      </p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleAddDJ(dj)}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-shadow flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Añadir a mi Agencia</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add DJ Modal */}
      {showAddModal && selectedDJ && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Añadir Artista
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {selectedDJ.nombre?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedDJ.nombre}</h3>
                  <p className="text-sm text-gray-500">{selectedDJ.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Relación
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="managed">Gestionado</option>
                  <option value="exclusive">Exclusivo</option>
                  <option value="partner">Colaborador</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comisión (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={formData.commissionRate}
                  onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio de Contrato
                </label>
                <input
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin de Contrato (opcional)
                </label>
                <input
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitAdd}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyDJManagement;
