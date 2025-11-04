import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Music,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Play,
  Trash2,
  ExternalLink,
  Plus,
  Download,
  Eye,
  Edit,
  Save,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Sistema de Gestión de Contenido y Portfolio del DJ
 * Permite gestionar mixes, videos, fotos, links y material promocional
 */
const DJContentManager = ({ djId, djData }) => {
  const [activeSection, setActiveSection] = useState('mixes'); // mixes, videos, photos, links, bio
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState(djData?.bio || '');

  // Mock data - En producción vendría del backend
  const [content, setContent] = useState({
    mixes: [
      {
        id: 1,
        titulo: 'Summer Mix 2025',
        descripcion: 'Progressive House Set',
        duracion: '62 min',
        fecha: '2025-01-15',
        url: 'https://soundcloud.com/...',
        plataforma: 'SoundCloud',
        reproducciones: 1250,
        thumbnail: 'https://via.placeholder.com/300x300/3b82f6/ffffff?text=Mix'
      },
      {
        id: 2,
        titulo: 'Tech House Session',
        descripcion: 'Live from Studio',
        duracion: '90 min',
        fecha: '2025-01-10',
        url: 'https://mixcloud.com/...',
        plataforma: 'Mixcloud',
        reproducciones: 890,
        thumbnail: 'https://via.placeholder.com/300x300/8b5cf6/ffffff?text=Mix'
      }
    ],
    videos: [
      {
        id: 1,
        titulo: 'NYE Performance 2024',
        descripcion: 'Full set at Club XYZ',
        duracion: '2h 30min',
        fecha: '2024-12-31',
        url: 'https://youtube.com/...',
        plataforma: 'YouTube',
        vistas: 5200,
        thumbnail: 'https://via.placeholder.com/400x225/ef4444/ffffff?text=Video'
      }
    ],
    photos: [
      {
        id: 1,
        titulo: 'Press Kit 2025',
        descripcion: 'Professional photos',
        cantidad: 15,
        fecha: '2025-01-01',
        url: 'https://drive.google.com/...',
        thumbnail: 'https://via.placeholder.com/300x400/10b981/ffffff?text=Photo'
      }
    ],
    links: [
      {
        id: 1,
        titulo: 'SoundCloud',
        url: 'https://soundcloud.com/djname',
        tipo: 'social',
        icon: 'music'
      },
      {
        id: 2,
        titulo: 'Instagram',
        url: 'https://instagram.com/djname',
        tipo: 'social',
        icon: 'image'
      },
      {
        id: 3,
        titulo: 'Resident Advisor',
        url: 'https://ra.co/dj/...',
        tipo: 'plataforma',
        icon: 'link'
      }
    ]
  });

  const sections = [
    { id: 'mixes', label: 'Mixes & Sets', icon: Music, count: content.mixes.length },
    { id: 'videos', label: 'Videos', icon: Video, count: content.videos.length },
    { id: 'photos', label: 'Fotos', icon: ImageIcon, count: content.photos.length },
    { id: 'links', label: 'Links', icon: LinkIcon, count: content.links.length },
    { id: 'bio', label: 'Bio', icon: FileText }
  ];

  const handleSaveBio = () => {
    // Aquí iría la llamada al backend
    toast.success('Bio actualizada correctamente');
    setEditingBio(false);
  };

  const handleDeleteItem = (type, itemId) => {
    setContent(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item.id !== itemId)
    }));
    toast.success('Elemento eliminado');
  };

  const MixCard = ({ mix }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
        <img
          src={mix.thumbnail}
          alt={mix.titulo}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <button className="p-4 bg-white bg-opacity-90 rounded-full transform scale-0 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-blue-600" />
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {mix.duracion}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{mix.titulo}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{mix.descripcion}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-500">{mix.fecha}</span>
          <span className="text-xs text-gray-500 dark:text-gray-500">{mix.reproducciones} plays</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={mix.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver en {mix.plataforma}
          </a>
          <button
            onClick={() => handleDeleteItem('mixes', mix.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const VideoCard = ({ video }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
    >
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-red-500 to-pink-600">
        <img
          src={video.thumbnail}
          alt={video.titulo}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <button className="p-4 bg-white bg-opacity-90 rounded-full transform scale-0 group-hover:scale-100 transition-transform">
            <Play className="w-8 h-8 text-red-600" />
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {video.duracion}
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{video.titulo}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{video.descripcion}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-500">{video.fecha}</span>
          <span className="text-xs text-gray-500 dark:text-gray-500">{video.vistas} vistas</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver en {video.plataforma}
          </a>
          <button
            onClick={() => handleDeleteItem('videos', video.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const PhotoCard = ({ photo }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
    >
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-green-500 to-teal-600">
        <img
          src={photo.thumbnail}
          alt={photo.titulo}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <button className="p-4 bg-white bg-opacity-90 rounded-full transform scale-0 group-hover:scale-100 transition-transform">
            <Eye className="w-6 h-6 text-green-600" />
          </button>
        </div>
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {photo.cantidad} fotos
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{photo.titulo}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{photo.descripcion}</p>

        <div className="flex items-center gap-2">
          <a
            href={photo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar
          </a>
          <button
            onClick={() => handleDeleteItem('photos', photo.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const LinkItem = ({ link }) => {
    const getIconColor = () => {
      if (link.icon === 'music') return 'text-orange-600';
      if (link.icon === 'image') return 'text-pink-600';
      return 'text-blue-600';
    };

    const getIcon = () => {
      if (link.icon === 'music') return <Music className="w-5 h-5" />;
      if (link.icon === 'image') return <ImageIcon className="w-5 h-5" />;
      return <LinkIcon className="w-5 h-5" />;
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${getIconColor()}`}>
            {getIcon()}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{link.titulo}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-500">{link.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleDeleteItem('links', link.id)}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {section.label}
              {section.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeSection === section.id
                    ? 'bg-white/20'
                    : 'bg-gray-200 dark:bg-gray-600'
                }`}>
                  {section.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeSection === 'mixes' && (
          <motion.div
            key="mixes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mixes & Sets ({content.mixes.length})
              </h3>
              <button
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Mix
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.mixes.map(mix => (
                <MixCard key={mix.id} mix={mix} />
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'videos' && (
          <motion.div
            key="videos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Videos ({content.videos.length})
              </h3>
              <button
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Video
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.videos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'photos' && (
          <motion.div
            key="photos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Fotos & Press Kit ({content.photos.length})
              </h3>
              <button
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Fotos
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.photos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} />
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'links' && (
          <motion.div
            key="links"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Links & Redes Sociales ({content.links.length})
              </h3>
              <button
                onClick={() => setIsAddingItem(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar Link
              </button>
            </div>
            <div className="space-y-2">
              {content.links.map(link => (
                <LinkItem key={link.id} link={link} />
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === 'bio' && (
          <motion.div
            key="bio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Biografía y Descripción
              </h3>
              {!editingBio ? (
                <button
                  onClick={() => setEditingBio(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar Bio
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingBio(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveBio}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              {!editingBio ? (
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {bioText || 'No hay biografía agregada. Haz clic en "Editar Bio" para agregar una.'}
                  </p>
                </div>
              ) : (
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  rows={12}
                  placeholder="Escribe la biografía del DJ aquí..."
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DJContentManager;
