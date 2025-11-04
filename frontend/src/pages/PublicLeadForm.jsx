import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, Calendar, MapPin, Users, DollarSign, Mail, Phone, Building2, MessageSquare, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api`;

const PublicLeadForm = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    tipo_evento: '',
    fecha_evento: '',
    ciudad: '',
    presupuesto_estimado: '',
    num_invitados: '',
    notas: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Capturar parámetros UTM de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || ''
    };
    setFormData(prev => ({ ...prev, ...utmData }));
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    if (!formData.tipo_evento) {
      newErrors.tipo_evento = 'Selecciona un tipo de evento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/leads/public`, formData);
      setSubmitted(true);
      toast.success('¡Gracias! Hemos recibido tu solicitud');
    } catch (error) {
      console.error('Error al enviar formulario:', error);
      toast.error(error.response?.data?.message || 'Error al enviar el formulario');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¡Solicitud Enviada!
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Gracias por contactarnos. Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo en las próximas 24-48 horas.
          </p>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 dark:text-purple-100">
              Hemos enviado un email de confirmación a <strong>{formData.email}</strong>
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Enviar otra solicitud
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-4"
          >
            <Sparkles className="w-8 h-8 text-purple-600" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Solicita tu Evento
          </h1>
          <p className="text-purple-200 text-lg">
            Completa el formulario y nos pondremos en contacto contigo
          </p>
        </div>

        {/* Formulario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de contacto */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Información de Contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.nombre
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                    } focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors`}
                    placeholder="Tu nombre"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                    } focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.telefono
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                    } focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors`}
                    placeholder="+34 600 000 000"
                  />
                  {errors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Empresa (opcional)
                  </label>
                  <input
                    type="text"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Nombre de tu empresa"
                  />
                </div>
              </div>
            </div>

            {/* Información del evento */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Detalles del Evento
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Evento *
                  </label>
                  <select
                    name="tipo_evento"
                    value={formData.tipo_evento}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.tipo_evento
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500'
                    } focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors`}
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="Boda">Boda</option>
                    <option value="Cumpleaños">Cumpleaños</option>
                    <option value="Corporativo">Corporativo</option>
                    <option value="Fiesta privada">Fiesta privada</option>
                    <option value="Festival">Festival</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {errors.tipo_evento && (
                    <p className="mt-1 text-sm text-red-600">{errors.tipo_evento}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    name="fecha_evento"
                    value={formData.fecha_evento}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ciudad
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="ciudad"
                      value={formData.ciudad}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="Barcelona, Madrid..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Invitados
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="num_invitados"
                      value={formData.num_invitados}
                      onChange={handleChange}
                      min="1"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="50, 100, 200..."
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Presupuesto Estimado
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      name="presupuesto_estimado"
                      value={formData.presupuesto_estimado}
                      onChange={handleChange}
                      min="0"
                      step="100"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="1000, 2000, 5000..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Notas Adicionales
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-700 dark:text-white transition-colors resize-none"
                placeholder="Cuéntanos más sobre tu evento, preferencias, necesidades especiales..."
              />
            </div>

            {/* Botón de envío */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Solicitud
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Al enviar este formulario, aceptas que nos pongamos en contacto contigo para gestionar tu solicitud.
            </p>
          </form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-purple-200 text-sm"
        >
          <p>¿Tienes alguna pregunta? Contáctanos directamente</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PublicLeadForm;
