import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  Instagram as FaInstagram,
  Heart as FaHeart,
  MessageCircle as FaComment,
  Eye as FaEye,
  Users as FaUserFriends,
  TrendingUp as FaChartLine,
  Image as FaImages,
  Trophy as FaTrophy,
  Calendar as FaCalendarAlt,
  ArrowUp as FaArrowUp,
  ArrowDown as FaArrowDown,
  RefreshCw as FaSync,
  Clock as FaClock,
  Clock,
  FileText as FaFilePdf,
  Sparkles as FaSparkles,
  Lightbulb as FaLightbulb,
  AlertCircle as FaAlertCircle
} from 'lucide-react';
import InstagramPostCard from './InstagramPostCard';

/**
 * Instagram Analytics Dashboard - Specialized Component
 * Displays comprehensive Instagram metrics, insights, and content performance
 *
 * Props:
 * - djId: ID of the DJ to show Instagram analytics for
 * - username: Instagram username
 * - onRefresh: Callback when data is refreshed
 */

const InstagramAnalyticsDashboard = ({ djId, username, onRefresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview'); // overview, posts, growth, insights, predictions
  const [hashtagsData, setHashtagsData] = useState(null);
  const [predictionsData, setPredictionsData] = useState(null);

  useEffect(() => {
    if (djId && username) {
      loadInstagramData();
      loadHashtagsData();
      loadPredictionsData();
    }
  }, [djId, username]);

  const loadInstagramData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Instagram-specific data from backend
      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/metrics?refresh=false`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('Instagram API Response:', result);
      console.log('Instagram data exists?', !!result.data?.platforms?.instagram);

      if (result.success && result.data?.platforms?.instagram) {
        const instagramData = result.data.platforms.instagram;
        console.log('Setting Instagram data:', instagramData);

        // Transform flat structure to nested metrics structure if needed
        const transformedData = {
          ...instagramData,
          metrics: instagramData.metrics || {
            followers: instagramData.followers || 0,
            following: instagramData.following || 0,
            posts: instagramData.posts || 0,
            engagement_rate: instagramData.engagement || 0,
            avg_likes: instagramData.avg_likes || 0,
            impressions: instagramData.impressions || 0,
            reach: instagramData.reach || 0,
            profile_views: instagramData.profile_views || 0
          }
        };

        console.log('Transformed data with metrics:', transformedData);
        setData(transformedData);
      } else if (result.success && result.data?.platforms && Object.keys(result.data.platforms).length === 0) {
        throw new Error('No tienes cuentas de Instagram vinculadas. Haz clic en "Link Account" para vincular una cuenta.');
      } else {
        throw new Error('No Instagram data available');
      }
    } catch (err) {
      console.error('Error loading Instagram data:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      // Force refresh from Instagram
      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'instagram' })
      });

      const result = await response.json();

      console.log('Instagram Refresh Response:', result);

      if (result.success && result.data?.instagram) {
        const instagramData = result.data.instagram;

        // Transform flat structure to nested metrics structure if needed
        const transformedData = {
          ...instagramData,
          metrics: instagramData.metrics || {
            followers: instagramData.followers || 0,
            following: instagramData.following || 0,
            posts: instagramData.posts || 0,
            engagement_rate: instagramData.engagement || 0,
            avg_likes: instagramData.avg_likes || 0,
            impressions: instagramData.impressions || 0,
            reach: instagramData.reach || 0,
            profile_views: instagramData.profile_views || 0
          }
        };

        setData(transformedData);
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Error refreshing Instagram data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      // Open PDF in new window
      const url = `http://localhost:3001/api/social-media/${djId}/instagram/report/pdf`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Error al generar el reporte PDF. Intenta de nuevo.');
    }
  };

  const loadHashtagsData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/instagram/hashtags?limit=20`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHashtagsData(result.data);
        }
      }
    } catch (err) {
      console.error('Error loading hashtags:', err);
    }
  };

  const loadPredictionsData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/instagram/predictions`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPredictionsData(result.data);
        } else {
          // Handle case when there's not enough data
          setPredictionsData({ insufficientData: true, message: result.message });
        }
      }
    } catch (err) {
      console.error('Error loading predictions:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FaInstagram className="text-6xl text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de Instagram...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FaInstagram className="text-4xl text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium mb-2">Error al cargar datos de Instagram</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadInstagramData}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const { profile, metrics, recent_posts, top_post, growth, method, is_mock } = data || {};

  return (
    <div className="space-y-6">
      {/* Header with Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {profile?.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt={profile.name}
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <FaInstagram className="text-4xl" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{profile?.name || username}</h2>
              <p className="text-white/90">@{username}</p>
              {profile?.biography && (
                <p className="text-white/80 text-sm mt-1 max-w-md">{profile.biography}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportPDF}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <FaFilePdf />
              <span>Exportar PDF</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <FaSync className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {/* Data source indicator */}
        <div className="flex items-center space-x-2 text-sm text-white/70">
          <FaClock />
          <span>
            {method === 'graph_api' && 'Datos oficiales de Instagram Graph API'}
            {method === 'public_graphql' && 'Datos públicos de Instagram'}
            {method === 'meta_tags' && 'Datos limitados (solo públicos)'}
            {method === 'mock_data' && 'Datos de ejemplo'}
          </span>
          {is_mock && <span className="bg-yellow-500/30 px-2 py-1 rounded">Demo</span>}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Resumen', icon: FaChartLine },
          { id: 'posts', label: 'Contenido', icon: FaImages },
          { id: 'growth', label: 'Crecimiento', icon: FaArrowUp },
          { id: 'insights', label: 'Insights', icon: FaEye },
          { id: 'predictions', label: 'Predicciones', icon: FaSparkles }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors ${
              selectedTab === tab.id
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <OverviewTab metrics={metrics} profile={profile} />
      )}

      {selectedTab === 'posts' && (
        <PostsTab recentPosts={recent_posts} topPost={top_post} />
      )}

      {selectedTab === 'growth' && (
        <GrowthTab growth={growth} metrics={metrics} />
      )}

      {selectedTab === 'insights' && (
        <InsightsTab metrics={metrics} hashtagsData={hashtagsData} />
      )}

      {selectedTab === 'predictions' && (
        <PredictionsTab predictionsData={predictionsData} />
      )}
    </div>
  );
};

// ============= TAB COMPONENTS =============

const OverviewTab = ({ metrics, profile }) => {
  const engagementRate = metrics?.engagement_rate || 0;
  const followers = metrics?.followers || 0;
  const following = metrics?.following || 0;
  const posts = metrics?.posts || 0;
  const avgLikes = metrics?.avg_likes || 0;

  // Calculate follower ratio
  const followerRatio = following > 0 ? (followers / following).toFixed(2) : 0;

  const kpiCards = [
    {
      label: 'Seguidores',
      value: formatNumber(followers),
      icon: FaUserFriends,
      color: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Siguiendo',
      value: formatNumber(following),
      icon: FaUserFriends,
      color: 'from-purple-500 to-purple-600'
    },
    {
      label: 'Publicaciones',
      value: formatNumber(posts),
      icon: FaImages,
      color: 'from-pink-500 to-pink-600'
    },
    {
      label: 'Engagement',
      value: `${engagementRate.toFixed(2)}%`,
      icon: FaHeart,
      color: 'from-red-500 to-red-600',
      subtitle: 'Promedio por post'
    },
    {
      label: 'Likes Promedio',
      value: formatNumber(avgLikes),
      icon: FaHeart,
      color: 'from-orange-500 to-orange-600'
    },
    {
      label: 'Ratio Followers',
      value: `${followerRatio}x`,
      icon: FaChartLine,
      color: 'from-green-500 to-green-600',
      subtitle: 'Followers / Following'
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="text-2xl text-white" />
              </div>
              {kpi.trend && (
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <FaArrowUp className="mr-1" />
                  {kpi.trend}
                </span>
              )}
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">{kpi.label}</h3>
            <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            {kpi.subtitle && (
              <p className="text-gray-500 text-xs mt-1">{kpi.subtitle}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Engagement Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FaChartLine className="mr-2 text-pink-600" />
          Análisis de Engagement
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Rate Gauge */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="transform -rotate-90 w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="url(#gradient)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${engagementRate * 5.026} 502.6`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{engagementRate.toFixed(1)}%</span>
                <span className="text-sm text-gray-600">Engagement Rate</span>
              </div>
            </div>
            <p className="text-center text-gray-600 mt-4 max-w-xs">
              {engagementRate >= 3 ? '¡Excelente! Por encima del promedio' :
               engagementRate >= 1 ? 'Bueno, dentro del promedio' :
               'Hay oportunidad de mejora'}
            </p>
          </div>

          {/* Stats Comparison */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Likes por Post</span>
                <span className="font-semibold">{formatNumber(avgLikes)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-600 h-3 rounded-full"
                  style={{ width: `${Math.min((avgLikes / followers) * 1000, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Followers</span>
                <span className="font-semibold">{formatNumber(followers)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 h-3 rounded-full"
                  style={{ width: `${Math.min((followers / 100000) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">Posts Totales</span>
                <span className="font-semibold">{formatNumber(posts)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-600 h-3 rounded-full"
                  style={{ width: `${Math.min((posts / 1000) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">Benchmark de la industria:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Engagement Rate: 1-3% es promedio para DJs</li>
                <li>• Ratio Followers: 2x+ es ideal</li>
                <li>• Frecuencia: 3-5 posts por semana</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostsTab = ({ recentPosts, topPost }) => {
  const posts = recentPosts || [];

  return (
    <div className="space-y-6">
      {/* Top Performing Post */}
      {topPost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <FaTrophy className="text-2xl text-yellow-500" />
            <h3 className="text-xl font-bold text-gray-900">Post Destacado</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topPost.thumbnail_url && (
              <img
                src={topPost.thumbnail_url}
                alt="Top post"
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <div>
              <p className="text-gray-700 mb-4">{topPost.caption || 'Sin descripción'}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center text-red-500 mb-1">
                    <FaHeart className="mr-2" />
                    <span className="font-semibold">{formatNumber(topPost.likes || 0)}</span>
                  </div>
                  <p className="text-xs text-gray-600">Likes</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center text-blue-500 mb-1">
                    <FaComment className="mr-2" />
                    <span className="font-semibold">{formatNumber(topPost.comments || 0)}</span>
                  </div>
                  <p className="text-xs text-gray-600">Comentarios</p>
                </div>
              </div>
              {topPost.timestamp && (
                <p className="text-xs text-gray-500 mt-3">
                  Publicado: {new Date(topPost.timestamp).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Posts Grid */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Publicaciones Recientes</h3>
        {posts.length === 0 ? (
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <FaImages className="text-4xl text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No hay posts recientes disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {posts.map((post, index) => (
              <InstagramPostCard
                key={post.id || index}
                post={post}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GrowthTab = ({ growth, metrics }) => {
  // Real data only - no mock data
  return (
    <div className="space-y-6">
      {/* Growth Summary */}
      {growth && growth.change !== undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Crecimiento de Followers</h3>
              <FaArrowUp className="text-2xl text-green-600" />
            </div>
            <p className="text-4xl font-bold text-green-600">
              {growth.change >= 0 ? '+' : ''}{formatNumber(growth.change)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              {growth.percentage >= 0 ? '+' : ''}{growth.percentage}% últimos 7 días
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Proyección 30 días</h3>
              <FaChartLine className="text-2xl text-blue-600" />
            </div>
            <p className="text-4xl font-bold text-blue-600">
              {formatNumber((metrics?.followers || 0) + (growth?.change || 0) * 4)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Estimado basado en tendencia actual
            </p>
          </motion.div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <FaChartLine className="text-4xl text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Datos de crecimiento no disponibles
          </h3>
          <p className="text-blue-700 text-sm">
            Los datos históricos de crecimiento se acumularán con el tiempo. Vuelve a revisar en unos días para ver tu evolución.
          </p>
        </div>
      )}

      {/* Historical Growth Message */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-3">
          📊 Datos Históricos
        </h3>
        <p className="text-yellow-800 text-sm mb-3">
          Los gráficos de evolución temporal estarán disponibles una vez que el sistema acumule suficientes datos históricos (mínimo 7 días de métricas).
        </p>
        <ul className="space-y-2 text-yellow-800 text-sm">
          <li>• Actualiza tus métricas regularmente haciendo clic en "Actualizar"</li>
          <li>• Los snapshots se guardan cada vez que actualizas</li>
          <li>• El sistema construirá gráficos automáticamente con los datos acumulados</li>
        </ul>
      </div>

      {/* Current Metrics Display */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Métricas Actuales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <p className="text-sm text-purple-700 mb-1">Seguidores Actuales</p>
            <p className="text-3xl font-bold text-purple-900">{formatNumber(metrics?.followers || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
            <p className="text-sm text-pink-700 mb-1">Engagement Rate</p>
            <p className="text-3xl font-bold text-pink-900">{(metrics?.engagement_rate || 0).toFixed(2)}%</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-700 mb-1">Total Posts</p>
            <p className="text-3xl font-bold text-blue-900">{formatNumber(metrics?.posts || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const InsightsTab = ({ metrics, hashtagsData }) => {
  const impressions = metrics?.impressions || 0;
  const reach = metrics?.reach || 0;
  const profileViews = metrics?.profile_views || 0;

  const insightsData = [
    { name: 'Impressions', value: impressions, color: '#8b5cf6' },
    { name: 'Reach', value: reach, color: '#ec4899' },
    { name: 'Profile Views', value: profileViews, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Insights KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <FaEye className="text-2xl text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Impresiones</h3>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(impressions)}</p>
          <p className="text-gray-500 text-xs mt-1">Últimos 30 días</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center">
              <FaUserFriends className="text-2xl text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Alcance</h3>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(reach)}</p>
          <p className="text-gray-500 text-xs mt-1">Cuentas únicas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <FaEye className="text-2xl text-white" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Visitas al Perfil</h3>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(profileViews)}</p>
          <p className="text-gray-500 text-xs mt-1">Visitas totales</p>
        </motion.div>
      </div>

      {/* Insights Chart */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Distribución de Insights</h3>
        {impressions > 0 || reach > 0 || profileViews > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={insightsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {insightsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <FaEye className="text-4xl text-yellow-500 mx-auto mb-3" />
            <p className="text-yellow-800 font-medium mb-2">Insights no disponibles</p>
            <p className="text-yellow-700 text-sm">
              Los insights detallados solo están disponibles con Instagram Graph API
              (cuenta Business/Creator)
            </p>
          </div>
        )}
      </div>

      {/* Hashtags Analysis */}
      {hashtagsData && hashtagsData.hashtags && hashtagsData.hashtags.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">#</span>
            Hashtags Más Usados
          </h3>

          {/* Hashtags Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Total Hashtags</p>
              <p className="text-3xl font-bold text-blue-900">{hashtagsData.stats.totalHashtags}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-purple-700 mb-1">Posts Analizados</p>
              <p className="text-3xl font-bold text-purple-900">{hashtagsData.stats.totalPosts}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
              <p className="text-sm text-pink-700 mb-1">Promedio por Post</p>
              <p className="text-3xl font-bold text-pink-900">{hashtagsData.stats.avgHashtagsPerPost}</p>
            </div>
          </div>

          {/* Hashtags Cloud */}
          <div className="flex flex-wrap gap-2">
            {hashtagsData.hashtags.map((hashtag, index) => {
              const maxCount = hashtagsData.hashtags[0]?.count || 1;
              const intensity = (hashtag.count / maxCount);
              const fontSize = 12 + (intensity * 12); // 12px to 24px

              return (
                <motion.div
                  key={hashtag.hashtag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium cursor-pointer hover:shadow-lg transition-all"
                    style={{
                      fontSize: `${fontSize}px`,
                      opacity: 0.6 + (intensity * 0.4)
                    }}
                  >
                    {hashtag.hashtag}
                    <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                      {hashtag.count}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                      <p className="font-semibold mb-1">{hashtag.hashtag}</p>
                      <p>Usado {hashtag.count} {hashtag.count === 1 ? 'vez' : 'veces'}</p>
                      <p>Engagement promedio: {formatNumber(hashtag.avgEngagement)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          💡 Tips para mejorar tus Insights
        </h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li>• Publica en horarios de mayor actividad de tu audiencia</li>
          <li>• Usa hashtags relevantes para aumentar el alcance</li>
          <li>• Crea contenido que genere conversación en los comentarios</li>
          <li>• Utiliza Instagram Stories para aumentar las visitas al perfil</li>
          <li>• Colabora con otros DJs/artistas para ampliar tu alcance</li>
        </ul>
      </div>
    </div>
  );
};

const PredictionsTab = ({ predictionsData }) => {
  if (!predictionsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaSparkles className="text-6xl text-purple-300 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Cargando predicciones...</p>
        </div>
      </div>
    );
  }

  if (predictionsData.insufficientData || predictionsData.minimumDataRequired) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
        <FaAlertCircle className="text-6xl text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-yellow-900 mb-3">
          Datos Insuficientes para Predicciones
        </h3>
        <p className="text-yellow-800 mb-4 max-w-2xl mx-auto">
          {predictionsData.message || 'Se necesitan al menos 3 actualizaciones de datos históricos para generar predicciones precisas.'}
        </p>
        <div className="bg-white rounded-lg p-6 max-w-xl mx-auto">
          <h4 className="font-semibold text-gray-900 mb-3">Cómo obtener predicciones:</h4>
          <ul className="text-left text-gray-700 space-y-2">
            <li>✓ Actualiza tus métricas regularmente (haz clic en "Actualizar")</li>
            <li>✓ Espera al menos 3-5 días entre actualizaciones</li>
            <li>✓ El sistema comenzará a mostrar predicciones automáticamente</li>
          </ul>
        </div>
      </div>
    );
  }

  const {
    growthTrend,
    engagementTrend,
    optimalPostingTimes,
    hashtagPerformance,
    contentRecommendations,
    futureProjections,
    dataQuality
  } = predictionsData;

  return (
    <div className="space-y-6">
      {/* Data Quality Indicator */}
      <div className={`rounded-xl p-4 border ${
        dataQuality.level === 'high' ? 'bg-green-50 border-green-200' :
        dataQuality.level === 'medium' ? 'bg-yellow-50 border-yellow-200' :
        'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaSparkles className={`text-2xl ${
              dataQuality.level === 'high' ? 'text-green-600' :
              dataQuality.level === 'medium' ? 'text-yellow-600' :
              'text-orange-600'
            }`} />
            <div>
              <h3 className="font-semibold text-gray-900">Calidad de Predicción: {
                dataQuality.level === 'high' ? 'Alta' :
                dataQuality.level === 'medium' ? 'Media' : 'Baja'
              }</h3>
              <p className="text-sm text-gray-700">{dataQuality.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Future Projections */}
      {futureProjections && futureProjections.available && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl"
        >
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <FaChartLine className="mr-3" />
            Proyección {futureProjections.timeframe}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
              <p className="text-white/80 text-sm mb-2">Seguidores Proyectados</p>
              <p className="text-4xl font-bold mb-1">{formatNumber(futureProjections.followers.projected)}</p>
              <p className="text-sm">
                {futureProjections.followers.change >= 0 ? '+' : ''}
                {formatNumber(futureProjections.followers.change)} ({futureProjections.followers.changePercent >= 0 ? '+' : ''}
                {futureProjections.followers.changePercent}%)
              </p>
              <p className="text-xs text-white/70 mt-2">Desde: {formatNumber(futureProjections.followers.current)}</p>
            </div>
            {futureProjections.engagement && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5">
                <p className="text-white/80 text-sm mb-2">Engagement Proyectado</p>
                <p className="text-4xl font-bold mb-1">{futureProjections.engagement.projected.toFixed(2)}%</p>
                <p className="text-sm">
                  Tendencia: {futureProjections.engagement.trend === 'improving' ? 'Mejorando ↑' : 'Decreciendo ↓'}
                </p>
                <p className="text-xs text-white/70 mt-2">Actual: {futureProjections.engagement.current.toFixed(2)}%</p>
              </div>
            )}
          </div>
          <p className="text-xs text-white/60 mt-4">
            Confianza: {futureProjections.confidence === 'high' ? 'Alta' : futureProjections.confidence === 'medium' ? 'Media' : 'Baja'}
          </p>
        </motion.div>
      )}

      {/* Growth & Engagement Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FaUserFriends className="mr-2 text-blue-600" />
            Tendencia de Crecimiento
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Seguidores Actuales</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(growthTrend.current)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tasa de Crecimiento</p>
              <p className={`text-2xl font-bold ${growthTrend.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthTrend.growthRate >= 0 ? '+' : ''}{growthTrend.growthRate}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Promedio Diario</p>
              <p className="text-xl font-semibold text-gray-900">
                {growthTrend.avgDailyGrowth >= 0 ? '+' : ''}{growthTrend.avgDailyGrowth} seguidores/día
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              growthTrend.trend === 'ascending' ? 'bg-green-50 border border-green-200' :
              growthTrend.trend === 'descending' ? 'bg-red-50 border border-red-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <p className="text-sm font-semibold">
                Tendencia: {
                  growthTrend.trend === 'ascending' ? '📈 Creciente' :
                  growthTrend.trend === 'descending' ? '📉 Decreciente' :
                  '➡️ Estable'
                }
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Predicción: {
                  growthTrend.prediction === 'positive' ? 'Crecimiento continuo' :
                  growthTrend.prediction === 'negative' ? 'Requiere atención' :
                  'Estabilidad esperada'
                }
              </p>
            </div>
          </div>
        </motion.div>

        {/* Engagement Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FaHeart className="mr-2 text-pink-600" />
            Tendencia de Engagement
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Engagement Actual</p>
              <p className="text-3xl font-bold text-gray-900">{engagementTrend.current}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Promedio Histórico</p>
              <p className="text-xl font-semibold text-gray-900">{engagementTrend.average}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cambio</p>
              <p className={`text-2xl font-bold ${engagementTrend.changeRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {engagementTrend.changeRate >= 0 ? '+' : ''}{engagementTrend.changeRate}%
              </p>
            </div>
            <div className={`p-3 rounded-lg ${
              engagementTrend.performanceLevel === 'excellent' ? 'bg-purple-50 border border-purple-200' :
              engagementTrend.performanceLevel === 'good' ? 'bg-green-50 border border-green-200' :
              engagementTrend.performanceLevel === 'average' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-orange-50 border border-orange-200'
            }`}>
              <p className="text-sm font-semibold">
                Rendimiento: {
                  engagementTrend.performanceLevel === 'excellent' ? '⭐ Excelente' :
                  engagementTrend.performanceLevel === 'good' ? '✅ Bueno' :
                  engagementTrend.performanceLevel === 'average' ? '⚠️ Promedio' :
                  '🔴 Bajo'
                }
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Tendencia: {
                  engagementTrend.trend === 'improving' ? 'Mejorando' :
                  engagementTrend.trend === 'declining' ? 'Decreciendo' :
                  'Estable'
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Optimal Posting Times */}
      {optimalPostingTimes && optimalPostingTimes.bestHours && optimalPostingTimes.bestHours.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2 text-indigo-600" />
            Mejores Horarios para Publicar
          </h3>
          <p className="text-gray-700 mb-4">{optimalPostingTimes.recommendation}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Hours */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Mejores Horarios</h4>
              <div className="space-y-2">
                {optimalPostingTimes.bestHours.map((hourData, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-indigo-900">{hourData.timeRange}</span>
                      <span className="text-sm text-indigo-700">{formatNumber(hourData.avgEngagement)} eng. promedio</span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-1">{hourData.postsAnalyzed} posts analizados</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Best Days */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Mejores Días</h4>
              <div className="space-y-2">
                {optimalPostingTimes.bestDays.map((dayData, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-pink-50 to-red-50 border border-pink-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-pink-900">{dayData.day}</span>
                      <span className="text-sm text-pink-700">{formatNumber(dayData.avgEngagement)} eng. promedio</span>
                    </div>
                    <p className="text-xs text-pink-600 mt-1">{dayData.postsAnalyzed} posts analizados</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-4 p-3 rounded-lg ${
            optimalPostingTimes.dataQuality === 'high' ? 'bg-green-50 border border-green-200' :
            optimalPostingTimes.dataQuality === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
            'bg-orange-50 border border-orange-200'
          }`}>
            <p className="text-sm">
              Análisis basado en {optimalPostingTimes.postsAnalyzed} posts • Calidad: {
                optimalPostingTimes.dataQuality === 'high' ? 'Alta' :
                optimalPostingTimes.dataQuality === 'medium' ? 'Media' : 'Baja'
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* Hashtag Performance */}
      {hashtagPerformance && hashtagPerformance.topPerformers && hashtagPerformance.topPerformers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">#</span>
            Rendimiento de Hashtags
          </h3>
          <p className="text-gray-700 mb-4">{hashtagPerformance.recommendation}</p>

          <div className="space-y-3">
            {hashtagPerformance.topPerformers.map((tag, idx) => (
              <div key={idx} className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-cyan-900">{tag.hashtag}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-cyan-700">
                      {formatNumber(tag.avgEngagement)} eng. promedio
                    </span>
                    <span className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full">
                      Usado {tag.timesUsed} {tag.timesUsed === 1 ? 'vez' : 'veces'}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-cyan-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(tag.consistency * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-cyan-600 mt-1">
                  Consistencia: {(tag.consistency * 100).toFixed(0)}%
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Total hashtags analizados: {hashtagPerformance.totalHashtagsAnalyzed}
          </p>
        </motion.div>
      )}

      {/* Content Recommendations */}
      {contentRecommendations && contentRecommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FaLightbulb className="mr-2 text-yellow-500" />
            Recomendaciones de Contenido
          </h3>
          <div className="space-y-3">
            {contentRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`border-l-4 rounded-lg p-4 ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-green-50 border-green-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                    <p className="text-xs font-medium text-gray-600">
                      Acción sugerida: {rec.action}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ML Info Footer */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
          <FaSparkles className="mr-2" />
          Sobre estas Predicciones
        </h3>
        <p className="text-purple-800 text-sm mb-3">
          Estas predicciones se generan mediante análisis estadístico de tus datos históricos de Instagram.
          El sistema identifica patrones, tendencias y comportamientos para proporcionarte insights accionables.
        </p>
        <ul className="text-purple-700 text-sm space-y-1">
          <li>• Actualiza tus métricas regularmente para mejorar la precisión</li>
          <li>• Las predicciones mejoran con más datos históricos</li>
          <li>• Los algoritmos se ajustan automáticamente a tus patrones únicos</li>
        </ul>
      </div>
    </div>
  );
};

// ============= UTILITY FUNCTIONS =============

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export default InstagramAnalyticsDashboard;
