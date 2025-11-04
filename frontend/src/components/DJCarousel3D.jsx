import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay, Navigation } from 'swiper/modules';
import { Music, Star, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

/**
 * Carrusel 3D de DJs con efecto Coverflow
 * Muestra los DJs destacados con animaciones y efectos visuales
 */
const DJCarousel3D = ({ djs, title = "DJs Destacados" }) => {
  const [activeDJ, setActiveDJ] = useState(null);

  // DJs por defecto si no se pasan datos
  const defaultDJs = [
    {
      id: 1,
      nombre: 'CELE',
      imagen: '/branding/djs/CELE.jpg',
      especialidad: 'Tech House',
      eventos: 45,
      rating: 4.9
    },
    {
      id: 2,
      nombre: 'CREW',
      imagen: '/branding/djs/CREW.jpg',
      especialidad: 'Techno',
      eventos: 38,
      rating: 4.8
    },
    {
      id: 3,
      nombre: 'JAUME',
      imagen: '/branding/djs/JAUME.jpg',
      especialidad: 'Progressive',
      eventos: 52,
      rating: 5.0
    },
    {
      id: 4,
      nombre: 'JULIO',
      imagen: '/branding/djs/JULIO.jpg',
      especialidad: 'Deep House',
      eventos: 41,
      rating: 4.7
    },
  ];

  const displayDJs = djs || defaultDJs;

  return (
    <div className="relative space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <span className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded" />
          <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            {title}
          </span>
        </h2>
        <div className="flex gap-2">
          <button className="swiper-button-prev-custom p-2 rounded-lg bg-gray-800/50 border border-orange-500/30 hover:bg-orange-500/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-orange-500" />
          </button>
          <button className="swiper-button-next-custom p-2 rounded-lg bg-gray-800/50 border border-orange-500/30 hover:bg-orange-500/20 transition-all">
            <ChevronRight className="w-5 h-5 text-orange-500" />
          </button>
        </div>
      </motion.div>

      {/* Carrusel 3D */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        {/* Glow effect de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-orange-500/5 blur-3xl" />

        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={false}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom',
          }}
          modules={[EffectCoverflow, Pagination, Autoplay, Navigation]}
          onSlideChange={(swiper) => setActiveDJ(displayDJs[swiper.realIndex])}
          className="dj-carousel-3d py-12"
        >
          {displayDJs.map((dj, index) => (
            <SwiperSlide key={dj.id} className="!w-[300px]">
              <DJCard dj={dj} isActive={activeDJ?.id === dj.id} />
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>

      {/* Info del DJ activo */}
      <AnimatePresence mode="wait">
        {activeDJ && (
          <motion.div
            key={activeDJ.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-2xl border border-orange-500/30 p-6 shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Music className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-400">Especialidad</p>
                  <p className="text-white font-semibold">{activeDJ.especialidad}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-xs text-gray-400">Eventos</p>
                  <p className="text-white font-semibold">{activeDJ.eventos} este año</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-400">Rating</p>
                  <p className="text-white font-semibold">{activeDJ.rating} / 5.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom CSS para el carrusel */}
      <style>{`
        .dj-carousel-3d {
          padding-top: 50px;
          padding-bottom: 50px;
        }

        .dj-carousel-3d .swiper-slide {
          background-position: center;
          background-size: cover;
        }

        .dj-carousel-3d .swiper-pagination-bullet {
          background: #FF5722;
          opacity: 0.5;
        }

        .dj-carousel-3d .swiper-pagination-bullet-active {
          opacity: 1;
          background: linear-gradient(135deg, #FF5722 0%, #FF0000 100%);
        }
      `}</style>
    </div>
  );
};

/**
 * Tarjeta individual de DJ con efectos 3D
 */
const DJCard = ({ dj, isActive }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        relative overflow-hidden rounded-2xl
        transition-all duration-500
        ${isActive ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-gray-900' : ''}
      `}
    >
      {/* Imagen del DJ */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={dj.imagen}
          alt={dj.nombre}
          className="w-full h-full object-cover"
        />

        {/* Overlay con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Badge de rating */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="absolute top-4 right-4 bg-yellow-500/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg"
        >
          <Star className="w-4 h-4 fill-white text-white" />
          <span className="text-sm font-bold text-white">{dj.rating}</span>
        </motion.div>

        {/* Info del DJ */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white drop-shadow-lg"
          >
            {dj.nombre}
          </motion.h3>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <div className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
              <span className="text-xs font-semibold text-white">
                {dj.especialidad}
              </span>
            </div>
            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-xs font-semibold text-white">
                {dj.eventos} eventos
              </span>
            </div>
          </motion.div>
        </div>

        {/* Efecto de brillo en hover */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20"
        />
      </div>
    </motion.div>
  );
};

export default DJCarousel3D;
