import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Instagram,
  Music as TikTok,
  Youtube,
  Facebook,
  Twitter,
  Activity,
  CheckCircle,
  XCircle,
  Link as LinkIcon,
  Unlink,
  RefreshCw,
  AlertCircle,
  Music,
  Loader,
  Edit,
  Save
} from 'lucide-react';

/**
 * Social Media Account Linker - Versión Simplificada
 * Solo requiere username público, sin OAuth
 */
const SocialMediaAccountLinker = ({ djId, djData, onLinked }) => {
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');

  // Configuración de plataformas
  const platforms = [
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'from-pink-500 to-purple-600',
      textColor: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/10',
      borderColor: 'border-pink-200 dark:border-pink-800',
      placeholder: '@username',
      baseUrl: 'https://www.instagram.com/'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TikTok,
      color: 'from-black to-cyan-500',
      textColor: 'text-gray-900',
      bgColor: 'bg-gray-50 dark:bg-gray-900/10',
      borderColor: 'border-gray-200 dark:border-gray-700',
      placeholder: '@username',
      baseUrl: 'https://www.tiktok.com/@'
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: Youtube,
      color: 'from-red-500 to-red-700',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/10',
      borderColor: 'border-red-200 dark:border-red-800',
      placeholder: '@channel',
      baseUrl: 'https://www.youtube.com/'
    },
    {
      id: 'spotify',
      name: 'Spotify',
      icon: Music,
      color: 'from-green-500 to-green-700',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/10',
      borderColor: 'border-green-200 dark:border-green-800',
      placeholder: 'artist-name',
      baseUrl: 'https://open.spotify.com/artist/'
    },
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      icon: Activity,
      color: 'from-orange-500 to-orange-700',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/10',
      borderColor: 'border-orange-200 dark:border-orange-800',
      placeholder: 'username',
      baseUrl: 'https://soundcloud.com/'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'from-blue-600 to-blue-800',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/10',
      borderColor: 'border-blue-200 dark:border-blue-800',
      placeholder: 'page-name',
      baseUrl: 'https://www.facebook.com/'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'from-sky-400 to-blue-500',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50 dark:bg-sky-900/10',
      borderColor: 'border-sky-200 dark:border-sky-800',
      placeholder: '@handle',
      baseUrl: 'https://twitter.com/'
    }
  ];

  useEffect(() => {
    loadLinkedAccounts();
  }, [djId]);

  const loadLinkedAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/linked`);
      const data = await response.json();

      if (data.success) {
        setLinkedAccounts(data.data || []);
      }
    } catch (error) {
      console.error('Error loading linked accounts:', error);
      // Fallback to localStorage if API fails
      const saved = localStorage.getItem(`dj_${djId}_social_accounts`);
      if (saved) {
        setLinkedAccounts(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = async (platform) => {
    if (!usernameInput.trim()) return;

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: platform.id,
          platform_username: usernameInput.trim().replace('@', '')
        })
      });

      const data = await response.json();

      if (data.success) {
        // Reload accounts from backend
        await loadLinkedAccounts();

        setEditingPlatform(null);
        setUsernameInput('');

        if (onLinked) onLinked();
      } else {
        alert('Error al vincular cuenta: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving username:', error);
      alert('Error al vincular cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (platformId) => {
    if (!confirm(`¿Seguro que quieres desvincular ${platformId}?`)) return;

    try {
      setLoading(true);

      const response = await fetch(`http://localhost:3001/api/social-media/${djId}/unlink/${platformId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Reload accounts from backend
        await loadLinkedAccounts();

        if (onLinked) onLinked();
      } else {
        alert('Error al desvincular cuenta: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error unlinking account:', error);
      alert('Error al desvincular cuenta');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (platform) => {
    const existing = linkedAccounts.find(a => a.platform === platform.id);
    setUsernameInput(existing?.platform_username || '');
    setEditingPlatform(platform.id);
  };

  const isLinked = (platformId) => {
    return linkedAccounts.find(acc => acc.platform === platformId && acc.active);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <LinkIcon className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Agregar Cuentas de Redes Sociales</h2>
        </div>
        <p className="text-blue-100">
          Agrega los nombres de usuario públicos para obtener métricas de cada plataforma
        </p>
      </div>

      {/* Status Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Agregadas</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {linkedAccounts.length} / {platforms.length}
            </p>
          </div>
          <button
            onClick={loadLinkedAccounts}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{
              width: `${(linkedAccounts.length / platforms.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const linked = isLinked(platform.id);
          const isEditing = editingPlatform === platform.id;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-lg border ${platform.borderColor} ${platform.bgColor} p-5 transition-all hover:shadow-lg`}
            >
              {/* Status indicator */}
              <div className="absolute top-3 right-3">
                {linked ? (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Agregado
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                    <XCircle className="w-3 h-3" />
                    Sin agregar
                  </div>
                )}
              </div>

              {/* Platform info */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${platform.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    {platform.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {platform.baseUrl}
                  </p>

                  {linked && !isEditing && (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        @{linked.platform_username}
                      </p>
                      <a
                        href={`${platform.baseUrl}${linked.platform_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Ver perfil →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Input or actions */}
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveUsername(platform)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveUsername(platform)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all bg-gradient-to-r ${platform.color} hover:shadow-lg`}
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setEditingPlatform(null);
                        setUsernameInput('');
                      }}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {linked ? (
                    <>
                      <button
                        onClick={() => startEditing(platform)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleUnlink(platform.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                      >
                        <Unlink className="w-4 h-4" />
                        Quitar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(platform)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-all bg-gradient-to-r ${platform.color} hover:shadow-lg`}
                    >
                      <LinkIcon className="w-4 h-4" />
                      Agregar {platform.name}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Info / Help */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">ℹ️ Cómo funciona</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
              <li>Solo necesitas el nombre de usuario público de cada red social</li>
              <li>El sistema obtendrá métricas públicas (seguidores, engagement, contenido)</li>
              <li>No requiere contraseñas ni autenticación</li>
              <li>Los datos se actualizan automáticamente cada 24 horas</li>
              <li>Puedes editar o quitar cuentas en cualquier momento</li>
            </ul>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              📊 Las métricas mostradas son las disponibles públicamente en cada plataforma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaAccountLinker;
