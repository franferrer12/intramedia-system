import { motion } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { Calendar, MapPin, Users, DollarSign, Music } from 'lucide-react';
import { animations } from '../styles/intraMediaTheme';

/**
 * EventCard 3D - Tarjeta colorida para eventos/DJs
 * Inspirado en FourVenues con colores vibrantes pero profesionales
 * - Gradientes atractivos
 * - Efectos 3D al hover
 * - Información destacada
 */
const EventCard3D = ({
  title,
  subtitle,
  date,
  location,
  attendees,
  price,
  djName,
  status = 'upcoming', // upcoming, completed, cancelled
  colorScheme = 'blue', // blue, purple, green, orange, pink
  image,
  onClick,
  delay = 0
}) => {
  // Esquemas de color vibrantes pero profesionales
  const colorSchemes = {
    blue: {
      gradient: 'from-blue-600 via-indigo-600 to-purple-600',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
      accent: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      glow: 'shadow-blue-500/20',
    },
    purple: {
      gradient: 'from-purple-600 via-pink-600 to-rose-600',
      bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30',
      accent: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
      glow: 'shadow-purple-500/20',
    },
    green: {
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      accent: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    },
    orange: {
      gradient: 'from-orange-600 via-amber-600 to-yellow-600',
      bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
      accent: 'text-orange-600 dark:text-orange-400',
      badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30',
      glow: 'shadow-orange-500/20',
    },
    pink: {
      gradient: 'from-pink-600 via-rose-600 to-red-600',
      bg: 'bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
      accent: 'text-pink-600 dark:text-pink-400',
      badge: 'bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30',
      glow: 'shadow-pink-500/20',
    },
  };

  const statusBadges = {
    upcoming: { label: 'Próximo', color: 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30' },
    completed: { label: 'Completado', color: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-500/30' },
    cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30' },
  };

  const currentScheme = colorSchemes[colorScheme] || colorSchemes.blue;
  const currentStatus = statusBadges[status] || statusBadges.upcoming;

  return (
    <motion.div
      initial={animations.fade.initial}
      animate={animations.fade.animate}
      transition={{
        duration: 0.5,
        delay: delay / 1000,
        ...animations.spring
      }}
      className="h-full"
    >
      <Tilt
        tiltMaxAngleX={animations.tilt.max}
        tiltMaxAngleY={animations.tilt.max}
        perspective={animations.tilt.perspective}
        scale={1.02}
        transitionSpeed={animations.tilt.speed}
        gyroscope={true}
        glareEnable={true}
        glareMaxOpacity={0.15}
        glareColor="#ffffff"
        glarePosition="all"
        className="h-full"
      >
        <div
          onClick={onClick}
          className={`
            relative h-full min-h-[320px] rounded-xl overflow-hidden
            bg-white dark:bg-gray-800/90
            backdrop-blur-sm
            border border-gray-200 dark:border-white/20
            ${currentScheme.glow} shadow-lg hover:shadow-xl
            transition-all duration-300
            ${onClick ? 'cursor-pointer' : ''}
            group
          `}
          style={{
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Barra superior colorida con gradiente */}
          <div className={`h-2 w-full bg-gradient-to-r ${currentScheme.gradient}`} />

          {/* Imagen o fondo decorativo */}
          {image ? (
            <div className="relative h-40 w-full overflow-hidden">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${currentScheme.gradient} opacity-40`} />
            </div>
          ) : (
            <div className={`relative h-40 w-full ${currentScheme.bg} flex items-center justify-center overflow-hidden`}>
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${currentScheme.gradient} opacity-10`}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <Music className={`w-16 h-16 ${currentScheme.accent} opacity-30`} />
            </div>
          )}

          {/* Badge de estado */}
          <div className="absolute top-6 right-4 z-10">
            <span className={`
              px-3 py-1 rounded-full text-xs font-semibold
              border backdrop-blur-sm
              ${currentStatus.color}
            `}>
              {currentStatus.label}
            </span>
          </div>

          {/* Contenido */}
          <div className="p-6 space-y-4">
            {/* Título y subtítulo */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Información del evento */}
            <div className="space-y-2.5">
              {date && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium">{date}</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm line-clamp-1">{location}</span>
                </div>
              )}

              {djName && (
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Music className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium">{djName}</span>
                </div>
              )}
            </div>

            {/* Footer con precio y asistentes */}
            {(price || attendees) && (
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
                {price && (
                  <div className="flex items-center gap-2">
                    <DollarSign className={`w-5 h-5 ${currentScheme.accent}`} />
                    <span className={`text-lg font-bold ${currentScheme.accent}`}>
                      €{price}
                    </span>
                  </div>
                )}

                {attendees && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{attendees}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Tilt>
    </motion.div>
  );
};

export default EventCard3D;
