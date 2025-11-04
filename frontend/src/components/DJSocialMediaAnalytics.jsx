import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  Music as TikTok,
  Youtube,
  Facebook,
  Twitter,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  BarChart3,
  Calendar,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  Target,
  Award,
  Globe,
  Clock,
  ArrowUp,
  ArrowDown,
  Music,
  Link as LinkIcon,
  X,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import SocialMediaAccountLinker from './SocialMediaAccountLinker';
import InstagramAnalyticsDashboard from './InstagramAnalyticsDashboard';
import socialMediaAPI from '../api/socialMediaAPI';

/**
 * Social Media Analytics Dashboard
 * Sistema completo de seguimiento de redes sociales para DJs
 * 100% REAL DATA - NO MOCK DATA
 */
const DJSocialMediaAnalytics = ({ djId, djData, eventosData }) => {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLinker, setShowLinker] = useState(false);
  const [realData, setRealData] = useState(null);
  const [loadingRealData, setLoadingRealData] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  // Load real data on mount and when djId changes
  useEffect(() => {
    loadSocialMediaData();
  }, [djId]);

  const loadSocialMediaData = async () => {
    try {
      setLoadingRealData(true);

      // Get linked accounts
      const accounts = await socialMediaAPI.getLinkedAccounts(djId);
      setLinkedAccounts(accounts);

      // Get metrics (use cached data, not fresh)
      if (accounts.length > 0) {
        const metrics = await socialMediaAPI.getSocialMetrics(djId, false);
        setRealData(metrics);
      } else {
        setRealData(null);
      }
    } catch (error) {
      console.error('Error loading social media data:', error);
      setRealData(null);
    } finally {
      setLoadingRealData(false);
    }
  };

  // Refresh with real API call
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      if (linkedAccounts.length > 0) {
        // Force refresh from platforms
        await socialMediaAPI.refreshMetrics(djId);

        // Reload data
        const metrics = await socialMediaAPI.getSocialMetrics(djId, false);
        setRealData(metrics);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('Error al actualizar métricas. Intenta de nuevo.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Extract platform data from realData
  const getPlatformData = (platform) => {
    if (!realData?.platforms || !realData.platforms[platform]) {
      return null;
    }
    return realData.platforms[platform];
  };

  // Build social data from real data
  const socialData = useMemo(() => {
    const data = {};

    linkedAccounts.forEach(account => {
      const platformData = getPlatformData(account.platform);
      if (platformData) {
        data[account.platform] = platformData;
      }
    });

    return data;
  }, [realData, linkedAccounts]);

  // Calcular totales
  const totalFollowers = useMemo(() => {
    if (!realData?.platforms) return 0;

    return Object.values(realData.platforms).reduce((sum, platform) => {
      return sum + (platform.followers || platform.subscribers || platform.monthlyListeners || 0);
    }, 0);
  }, [realData]);

  const totalEngagement = useMemo(() => {
    if (!realData?.platforms) return 0;

    const platforms = ['instagram', 'facebook', 'twitter']
      .map(p => realData.platforms[p])
      .filter(p => p && p.engagement);

    if (platforms.length === 0) return 0;

    const avgEngagement = platforms.reduce((sum, p) => sum + (p.engagement || 0), 0) / platforms.length;
    return avgEngagement;
  }, [realData]);

  // Plataformas disponibles (ahora basado en cuentas vinculadas)
  const availablePlatformConfigs = [
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-purple-600' },
    { id: 'tiktok', name: 'TikTok', icon: TikTok, color: 'from-black to-cyan-500' },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-700' },
    { id: 'spotify', name: 'Spotify', icon: Music, color: 'from-green-500 to-green-700' },
    { id: 'soundcloud', name: 'SoundCloud', icon: Activity, color: 'from-orange-500 to-orange-700' },
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-800' },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'from-sky-400 to-blue-500' }
  ];

  const platforms = useMemo(() => {
    return availablePlatformConfigs
      .filter(config => linkedAccounts.some(acc => acc.platform === config.id))
      .map(config => ({
        ...config,
        data: socialData[config.id]
      }));
  }, [linkedAccounts, socialData]);

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Loading state
  if (loadingRealData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando datos de redes sociales...</p>
        </div>
      </div>
    );
  }

  // No accounts linked state
  if (linkedAccounts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-8 h-8" />
                <h2 className="text-2xl font-bold">Social Media Analytics</h2>
              </div>
              <p className="text-purple-100">
                Seguimiento completo de redes sociales y métricas de crecimiento
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No hay cuentas de redes sociales vinculadas
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vincula las cuentas de redes sociales del DJ para comenzar a ver métricas y estadísticas en tiempo real.
          </p>
          <motion.button
            onClick={() => setShowLinker(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow mx-auto"
          >
            <LinkIcon className="w-5 h-5" />
            Vincular Primera Cuenta
          </motion.button>
        </div>

        {/* Modal de vinculación de cuentas */}
        <AnimatePresence>
          {showLinker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto relative"
              >
                <button
                  onClick={() => setShowLinker(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <div className="p-6">
                  <SocialMediaAccountLinker
                    djId={djId}
                    djData={djData}
                    onLinked={() => {
                      loadSocialMediaData();
                      setShowLinker(false);
                    }}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Social Media Analytics</h2>
            </div>
            <p className="text-purple-100 mb-4">
              Seguimiento completo de redes sociales y métricas de crecimiento
            </p>

            {/* KPIs rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-xs text-purple-100 mb-1">Total Seguidores</p>
                <p className="text-2xl font-bold">{formatNumber(totalFollowers)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-xs text-purple-100 mb-1">Engagement Promedio</p>
                <p className="text-2xl font-bold">
                  {totalEngagement > 0 ? totalEngagement.toFixed(1) + '%' : 'N/A'}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-xs text-purple-100 mb-1">Plataformas Activas</p>
                <p className="text-2xl font-bold">{linkedAccounts.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                <p className="text-xs text-purple-100 mb-1">Última Actualización</p>
                <p className="text-sm font-bold">
                  {realData?.lastUpdate
                    ? new Date(realData.lastUpdate).toLocaleDateString('es-ES')
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <motion.button
              onClick={() => setShowLinker(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              Vincular Cuentas
            </motion.button>

            <motion.button
              onClick={handleRefresh}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualizando...' : 'Actualizar'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        {/* Selector de plataforma */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPlatform === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          {platforms.map(platform => {
            const Icon = platform.icon;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedPlatform === platform.id
                    ? 'bg-gradient-to-r ' + platform.color + ' text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {platform.name}
              </button>
            );
          })}
        </div>

        {/* Selector de rango temporal */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="1y">Último año</option>
        </select>
      </div>

      {/* Instagram Detailed Dashboard */}
      {selectedPlatform === 'instagram' && linkedAccounts.some(acc => acc.platform === 'instagram') && (
        <div className="mb-6">
          <InstagramAnalyticsDashboard
            djId={djId}
            username={linkedAccounts.find(acc => acc.platform === 'instagram')?.platform_username}
            onRefresh={() => loadSocialMediaData()}
          />
        </div>
      )}

      {/* Cards de métricas por plataforma */}
      {selectedPlatform !== 'instagram' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {platforms.map(platform => {
            const Icon = platform.icon;
            const data = platform.data;

            if (!data) return null;

            const mainMetric = data.followers || data.subscribers || data.monthlyListeners || 0;
            const change = data.followersChange || data.subscribersChange || data.listenersChange || 0;
            const changePercent = data.followersChangePercent || data.subscribersChangePercent || data.listenersChangePercent || 0;
            const isPositive = changePercent > 0;

            return (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="relative group"
              >
                {/* Glow effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${platform.color} rounded-lg opacity-0 group-hover:opacity-20 blur transition duration-300`} />

                <div className="relative bg-white dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${platform.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {changePercent !== 0 && (
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {Math.abs(changePercent).toFixed(1)}%
                      </div>
                    )}
                  </div>

                  {/* Métrica principal */}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{platform.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(mainMetric)}
                    </p>
                    {change > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        +{formatNumber(change)} este mes
                      </p>
                    )}
                  </div>

                  {/* Métricas secundarias */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2">
                    {platform.id === 'instagram' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {data.engagement ? data.engagement.toFixed(1) + '%' : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {data.posts || data.recent_posts?.length || 0}
                          </p>
                        </div>
                      </>
                    )}
                    {platform.id === 'tiktok' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.views || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Views</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.avgViews || 0)}
                          </p>
                        </div>
                      </>
                    )}
                    {platform.id === 'youtube' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.views || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Videos</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {data.videos || 0}
                          </p>
                        </div>
                      </>
                    )}
                    {platform.id === 'spotify' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Streams</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.streams || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Playlists</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {data.playlists || 0}
                          </p>
                        </div>
                      </>
                    )}
                    {platform.id === 'soundcloud' && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Plays</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.plays || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Likes</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.likes || 0)}
                          </p>
                        </div>
                      </>
                    )}
                    {(platform.id === 'facebook' || platform.id === 'twitter') && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Engagement</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {data.engagement ? data.engagement.toFixed(1) + '%' : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Reach</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatNumber(data.reach || data.impressions || 0)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Información de datos reales */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Datos 100% Reales
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Las métricas mostradas son datos reales obtenidos directamente de las plataformas de redes sociales.
              Los gráficos históricos y métricas avanzadas estarán disponibles una vez que se acumulen más datos a lo largo del tiempo.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de vinculación de cuentas */}
      <AnimatePresence>
        {showLinker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto relative"
            >
              {/* Botón cerrar */}
              <button
                onClick={() => setShowLinker(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Contenido */}
              <div className="p-6">
                <SocialMediaAccountLinker
                  djId={djId}
                  djData={djData}
                  onLinked={() => {
                    // Reload data después de vincular
                    loadSocialMediaData();
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DJSocialMediaAnalytics;
