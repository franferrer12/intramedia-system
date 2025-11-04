import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  Heart,
  MessageCircle,
  Award,
  BarChart3,
  RefreshCw,
  X
} from 'lucide-react';
import axios from 'axios';

/**
 * DJ Comparison Dashboard Component
 * Compares Instagram metrics across multiple DJs
 */
const DJComparisonDashboard = () => {
  const [allDJs, setAllDJs] = useState([]);
  const [selectedDJs, setSelectedDJs] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all DJs on mount
  useEffect(() => {
    fetchAllDJs();
  }, []);

  const fetchAllDJs = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/djs');
      // Ensure allDJs is always an array
      const djsData = Array.isArray(response.data)
        ? response.data
        : (response.data?.data || response.data?.djs || []);
      setAllDJs(djsData);
    } catch (err) {
      console.error('Error fetching DJs:', err);
      setError('Error al cargar la lista de DJs');
      setAllDJs([]); // Set empty array on error
    }
  };

  const handleDJSelection = (djId) => {
    setSelectedDJs(prev => {
      if (prev.includes(djId)) {
        return prev.filter(id => id !== djId);
      } else if (prev.length < 10) {
        return [...prev, djId];
      } else {
        alert('Máximo 10 DJs para comparar');
        return prev;
      }
    });
  };

  const handleCompare = async () => {
    if (selectedDJs.length < 2) {
      alert('Selecciona al menos 2 DJs para comparar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3001/api/social-media/compare', {
        djIds: selectedDJs
      });

      setComparisonData(response.data.data);
    } catch (err) {
      console.error('Error comparing DJs:', err);
      setError(err.response?.data?.error || 'Error al comparar DJs');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedDJs([]);
    setComparisonData(null);
    setError(null);
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                Comparación de DJs
              </h1>
              <p className="text-gray-600">
                Compara métricas de Instagram entre múltiples DJs
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* DJ Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Seleccionar DJs ({selectedDJs.length}/10)
            </h2>
            <div className="flex space-x-3">
              {selectedDJs.length > 0 && (
                <button
                  onClick={handleReset}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Limpiar</span>
                </button>
              )}
              <button
                onClick={handleCompare}
                disabled={selectedDJs.length < 2 || loading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Comparando...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4" />
                    <span>Comparar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {allDJs.map(dj => (
              <button
                key={dj.id}
                onClick={() => handleDJSelection(dj.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDJs.includes(dj.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    selectedDJs.includes(dj.id) ? 'bg-purple-500' : 'bg-gray-300'
                  }`}></div>
                  <span className="font-medium text-gray-800 truncate">
                    {dj.nombre}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Comparison Results */}
        {comparisonData && (
          <>
            {/* Rankings Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Most Followers */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Más Seguidores</h3>
                </div>
                <div className="space-y-3">
                  {comparisonData.rankings.mostFollowers.map((dj, idx) => (
                    <div key={dj.djId} className="flex items-center justify-between bg-white/20 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white/30 rounded-full font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{dj.djName}</span>
                      </div>
                      <span className="font-bold">{formatNumber(dj.followers)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Engagement */}
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Heart className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Mejor Engagement</h3>
                </div>
                <div className="space-y-3">
                  {comparisonData.rankings.bestEngagement.map((dj, idx) => (
                    <div key={dj.djId} className="flex items-center justify-between bg-white/20 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white/30 rounded-full font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{dj.djName}</span>
                      </div>
                      <span className="font-bold">{dj.engagement_rate.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best Ratio */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center space-x-3 mb-4">
                  <Award className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Mejor Ratio</h3>
                </div>
                <div className="space-y-3">
                  {comparisonData.rankings.bestRatio.map((dj, idx) => (
                    <div key={dj.djId} className="flex items-center justify-between bg-white/20 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white/30 rounded-full font-bold">
                          {idx + 1}
                        </div>
                        <span className="font-medium">{dj.djName}</span>
                      </div>
                      <span className="font-bold">{dj.follower_ratio}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Comparación Detallada</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-bold text-gray-700">DJ</th>
                      <th className="text-left py-4 px-4 font-bold text-gray-700">Username</th>
                      <th className="text-right py-4 px-4 font-bold text-gray-700">
                        <div className="flex items-center justify-end space-x-2">
                          <Users className="w-4 h-4" />
                          <span>Seguidores</span>
                        </div>
                      </th>
                      <th className="text-right py-4 px-4 font-bold text-gray-700">
                        <div className="flex items-center justify-end space-x-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Siguiendo</span>
                        </div>
                      </th>
                      <th className="text-right py-4 px-4 font-bold text-gray-700">Posts</th>
                      <th className="text-right py-4 px-4 font-bold text-gray-700">
                        <div className="flex items-center justify-end space-x-2">
                          <Heart className="w-4 h-4" />
                          <span>Engagement</span>
                        </div>
                      </th>
                      <th className="text-right py-4 px-4 font-bold text-gray-700">
                        <div className="flex items-center justify-end space-x-2">
                          <Heart className="w-4 h-4" />
                          <span>Avg Likes</span>
                        </div>
                      </th>
                      <th className="text-right py-4 px-4 font-bold text-gray-700">Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.comparisons.map((dj, idx) => (
                      <tr
                        key={dj.djId}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="py-4 px-4 font-semibold text-gray-800">{dj.djName}</td>
                        <td className="py-4 px-4 text-gray-600">@{dj.instagram.username}</td>
                        <td className="py-4 px-4 text-right font-bold text-blue-600">
                          {formatNumber(dj.instagram.followers)}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">
                          {formatNumber(dj.instagram.following)}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">
                          {dj.instagram.posts}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-pink-600">
                          {dj.instagram.engagement_rate.toFixed(2)}%
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600">
                          {formatNumber(dj.instagram.avg_likes)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-purple-600">
                          {dj.instagram.follower_ratio}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!comparisonData && !loading && !error && selectedDJs.length >= 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Haz clic en "Comparar" para ver los resultados
            </p>
          </div>
        )}

        {!comparisonData && !loading && !error && selectedDJs.length < 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Selecciona al menos 2 DJs para empezar la comparación
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DJComparisonDashboard;
