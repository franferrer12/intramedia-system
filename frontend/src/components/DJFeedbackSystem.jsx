import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Filter,
  Award,
  Target,
  Lightbulb
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Sistema de Feedback y Evaluaciones para DJs
 * Permite a managers dar feedback post-evento y hacer seguimiento del desarrollo
 */
const DJFeedbackSystem = ({ djId, djData, eventosData }) => {
  const [activeView, setActiveView] = useState('list'); // list, create, detail
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [filterRating, setFilterRating] = useState('all'); // all, 5, 4, 3, 2, 1
  const [newFeedback, setNewFeedback] = useState({
    eventoId: '',
    rating: 5,
    puntualidad: 5,
    profesionalismo: 5,
    equipamiento: 5,
    repertorio: 5,
    interaccionPublico: 5,
    aspectosPositivos: '',
    areasAMejorar: '',
    comentarios: '',
    recomendaciones: ''
  });

  // Mock data - En producción vendría del backend
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      eventoId: 1,
      eventoNombre: 'Fiesta Año Nuevo 2025',
      fecha: '2025-01-01',
      rating: 5,
      evaluador: 'Manager Principal',
      puntualidad: 5,
      profesionalismo: 5,
      equipamiento: 5,
      repertorio: 5,
      interaccionPublico: 5,
      aspectosPositivos: 'Excelente performance, equipamiento impecable, llegó 30 min antes para setup',
      areasAMejorar: 'Ninguna',
      comentarios: 'Performance sobresaliente. El cliente quedó extremadamente satisfecho.',
      recomendaciones: 'Candidato ideal para eventos VIP',
      fechaCreacion: '2025-01-02'
    },
    {
      id: 2,
      eventoId: 2,
      eventoNombre: 'Boda en Club XYZ',
      fecha: '2024-12-28',
      rating: 4,
      evaluador: 'Manager Principal',
      puntualidad: 5,
      profesionalismo: 4,
      equipamiento: 4,
      repertorio: 4,
      interaccionPublico: 4,
      aspectosPositivos: 'Buena lectura del público, adaptación al ambiente de boda',
      areasAMejorar: 'Mejorar comunicación previa con cliente sobre playlist',
      comentarios: 'Buen trabajo general. Cliente satisfecho pero hubo pequeño malentendido sobre música.',
      recomendaciones: 'Recordar confirmar playlist detallada 48h antes del evento',
      fechaCreacion: '2024-12-29'
    }
  ]);

  const handleCreateFeedback = () => {
    const feedback = {
      id: feedbacks.length + 1,
      ...newFeedback,
      evaluador: 'Manager Principal',
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
    setFeedbacks([feedback, ...feedbacks]);
    toast.success('Feedback creado exitosamente');
    setActiveView('list');
    // Reset form
    setNewFeedback({
      eventoId: '',
      rating: 5,
      puntualidad: 5,
      profesionalismo: 5,
      equipamiento: 5,
      repertorio: 5,
      interaccionPublico: 5,
      aspectosPositivos: '',
      areasAMejorar: '',
      comentarios: '',
      recomendaciones: ''
    });
  };

  const handleDeleteFeedback = (id) => {
    setFeedbacks(feedbacks.filter(f => f.id !== id));
    toast.success('Feedback eliminado');
    if (selectedFeedback?.id === id) {
      setActiveView('list');
      setSelectedFeedback(null);
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filterRating === 'all') return true;
    return f.rating === parseInt(filterRating);
  });

  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : 0;

  const avgByCategory = {
    puntualidad: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.puntualidad, 0) / feedbacks.length).toFixed(1) : 0,
    profesionalismo: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.profesionalismo, 0) / feedbacks.length).toFixed(1) : 0,
    equipamiento: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.equipamiento, 0) / feedbacks.length).toFixed(1) : 0,
    repertorio: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.repertorio, 0) / feedbacks.length).toFixed(1) : 0,
    interaccionPublico: feedbacks.length > 0 ? (feedbacks.reduce((sum, f) => sum + f.interaccionPublico, 0) / feedbacks.length).toFixed(1) : 0
  };

  const StarRating = ({ value, onChange, readOnly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange(star)}
            className={`transition-all ${!readOnly ? 'hover:scale-110' : ''}`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const FeedbackCard = ({ feedback }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => {
        setSelectedFeedback(feedback);
        setActiveView('detail');
      }}
      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {feedback.eventoNombre}
          </h4>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {feedback.fecha}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {feedback.evaluador}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {feedback.rating}.0
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {feedback.fechaCreacion}
          </span>
        </div>
      </div>

      {/* Mini scores */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Punt.</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.puntualidad}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Prof.</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.profesionalismo}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Equip.</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.equipamiento}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Repert.</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.repertorio}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">Público</div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{feedback.interaccionPublico}</div>
        </div>
      </div>

      {/* Preview */}
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {feedback.comentarios}
      </p>

      {/* Action hint */}
      <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Ver detalles
        </span>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {activeView === 'list' && (
        <>
          {/* Header & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Rating Promedio</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{avgRating}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                De {feedbacks.length} evaluaciones
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Puntualidad</span>
              </div>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{avgByCategory.puntualidad}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Profesionalismo</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgByCategory.profesionalismo}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Interacción</span>
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{avgByCategory.interaccionPublico}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRating('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterRating === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Todos
              </button>
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(rating.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                    filterRating === rating.toString()
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  {rating}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveView('create')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              Nuevo Feedback
            </button>
          </div>

          {/* Feedbacks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeedbacks.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No hay feedbacks registrados</p>
              </div>
            ) : (
              filteredFeedbacks.map(feedback => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))
            )}
          </div>
        </>
      )}

      {activeView === 'create' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nuevo Feedback</h3>
            <button
              onClick={() => setActiveView('list')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-6">
            {/* Evento Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evento
              </label>
              <select
                value={newFeedback.eventoId}
                onChange={(e) => setNewFeedback({ ...newFeedback, eventoId: e.target.value })}
                className="input"
              >
                <option value="">Seleccionar evento...</option>
                {eventosData?.map(evento => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nombre_evento} - {evento.fecha}
                  </option>
                ))}
              </select>
            </div>

            {/* Overall Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating General
              </label>
              <StarRating
                value={newFeedback.rating}
                onChange={(value) => setNewFeedback({ ...newFeedback, rating: value })}
              />
            </div>

            {/* Category Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Puntualidad
                </label>
                <StarRating
                  value={newFeedback.puntualidad}
                  onChange={(value) => setNewFeedback({ ...newFeedback, puntualidad: value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profesionalismo
                </label>
                <StarRating
                  value={newFeedback.profesionalismo}
                  onChange={(value) => setNewFeedback({ ...newFeedback, profesionalismo: value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Equipamiento
                </label>
                <StarRating
                  value={newFeedback.equipamiento}
                  onChange={(value) => setNewFeedback({ ...newFeedback, equipamiento: value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repertorio
                </label>
                <StarRating
                  value={newFeedback.repertorio}
                  onChange={(value) => setNewFeedback({ ...newFeedback, repertorio: value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interacción con Público
                </label>
                <StarRating
                  value={newFeedback.interaccionPublico}
                  onChange={(value) => setNewFeedback({ ...newFeedback, interaccionPublico: value })}
                />
              </div>
            </div>

            {/* Text Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                Aspectos Positivos
              </label>
              <textarea
                value={newFeedback.aspectosPositivos}
                onChange={(e) => setNewFeedback({ ...newFeedback, aspectosPositivos: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="¿Qué hizo bien el DJ?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                Áreas a Mejorar
              </label>
              <textarea
                value={newFeedback.areasAMejorar}
                onChange={(e) => setNewFeedback({ ...newFeedback, areasAMejorar: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="¿En qué puede mejorar?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Comentarios Generales
              </label>
              <textarea
                value={newFeedback.comentarios}
                onChange={(e) => setNewFeedback({ ...newFeedback, comentarios: e.target.value })}
                rows={4}
                className="input resize-none"
                placeholder="Comentarios adicionales sobre el evento..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-600" />
                Recomendaciones
              </label>
              <textarea
                value={newFeedback.recomendaciones}
                onChange={(e) => setNewFeedback({ ...newFeedback, recomendaciones: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="Recomendaciones para futuros eventos..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setActiveView('list')}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFeedback}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md"
              >
                Guardar Feedback
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {activeView === 'detail' && selectedFeedback && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedFeedback.eventoNombre}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {selectedFeedback.fecha}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedFeedback.evaluador}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {selectedFeedback.rating}.0
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteFeedback(selectedFeedback.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView('list')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Category Scores */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Puntualidad', value: selectedFeedback.puntualidad },
                { label: 'Profesionalismo', value: selectedFeedback.profesionalismo },
                { label: 'Equipamiento', value: selectedFeedback.equipamiento },
                { label: 'Repertorio', value: selectedFeedback.repertorio },
                { label: 'Interacción', value: selectedFeedback.interaccionPublico }
              ].map((cat, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">{cat.label}</p>
                  <div className="flex justify-center mb-1">
                    <StarRating value={cat.value} readOnly />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{cat.value}.0</p>
                </div>
              ))}
            </div>

            {/* Sections */}
            {selectedFeedback.aspectosPositivos && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Aspectos Positivos</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedFeedback.aspectosPositivos}
                </p>
              </div>
            )}

            {selectedFeedback.areasAMejorar && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Áreas a Mejorar</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedFeedback.areasAMejorar}
                </p>
              </div>
            )}

            {selectedFeedback.comentarios && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Comentarios Generales</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedFeedback.comentarios}
                </p>
              </div>
            )}

            {selectedFeedback.recomendaciones && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-5 border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white">Recomendaciones</h4>
                </div>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedFeedback.recomendaciones}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DJFeedbackSystem;
