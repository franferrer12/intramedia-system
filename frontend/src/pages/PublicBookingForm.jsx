import { useState } from 'react';
import {
  Calendar, Clock, User, Mail, Phone, MapPin,
  Users, MessageSquare, DollarSign, CheckCircle,
  AlertCircle, Loader, Building2, Music
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationsAPI } from '../services/api';

/**
 * Public Booking Form
 * Sprint 4.2 - Formulario público de reservas
 */
function PublicBookingForm() {
  const [step, setStep] = useState(1); // 1: Form, 2: Availability Check, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [reservationNumber, setReservationNumber] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Agency (hardcoded for demo - should come from URL param in production)
    agency_id: 1,

    // Client info
    client_name: '',
    client_email: '',
    client_phone: '',
    client_company: '',

    // Event info
    event_type: '',
    event_date: '',
    event_start_time: '',
    event_duration_hours: 4,
    event_location: '',
    event_description: '',
    estimated_guests: '',

    // Services
    services_requested: [],
    budget_range: ''
  });

  const [errors, setErrors] = useState({});

  // Event types
  const eventTypes = [
    'Boda',
    'Cumpleaños',
    'Corporativo',
    'Fiesta Privada',
    'Quinceañera',
    'Baby Shower',
    'Graduación',
    'Otro'
  ];

  // Services
  const availableServices = [
    'DJ',
    'Sonido',
    'Luces',
    'Karaoke',
    'Fotografía',
    'Video',
    'Decoración'
  ];

  // Budget ranges
  const budgetRanges = [
    'Menos de $500',
    '$500 - $1,000',
    '$1,000 - $2,000',
    '$2,000 - $5,000',
    'Más de $5,000'
  ];

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      const currentServices = formData.services_requested;
      if (checked) {
        setFormData({
          ...formData,
          services_requested: [...currentServices, value]
        });
      } else {
        setFormData({
          ...formData,
          services_requested: currentServices.filter(s => s !== value)
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.client_name.trim()) newErrors.client_name = 'Nombre requerido';
    if (!formData.client_email.trim()) newErrors.client_email = 'Email requerido';
    if (!formData.client_phone.trim()) newErrors.client_phone = 'Teléfono requerido';
    if (!formData.event_type) newErrors.event_type = 'Tipo de evento requerido';
    if (!formData.event_date) newErrors.event_date = 'Fecha requerida';

    // Email validation
    if (formData.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Email inválido';
    }

    // Date validation (no past dates)
    if (formData.event_date) {
      const selectedDate = new Date(formData.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.event_date = 'La fecha no puede ser en el pasado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check availability
  const handleCheckAvailability = async () => {
    if (!validateForm()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);
    setStep(2);

    try {
      const response = await reservationsAPI.checkAvailability({
        agency_id: formData.agency_id,
        event_date: formData.event_date,
        event_start_time: formData.event_start_time || undefined,
        event_duration_hours: formData.event_duration_hours || undefined
      });

      setAvailabilityStatus(response.data);

      // Auto-submit if available
      if (response.data.available) {
        await handleSubmit();
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error('Error al verificar disponibilidad');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Submit reservation
  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await reservationsAPI.createReservation({
        ...formData,
        estimated_guests: formData.estimated_guests ? parseInt(formData.estimated_guests) : null,
        event_duration_hours: formData.event_duration_hours || null,
        ip_address: null, // Will be set by backend
        user_agent: navigator.userAgent,
        source: 'web_form'
      });

      setReservationNumber(response.data.data.reservation_number);
      setStep(3);
      toast.success('¡Reserva creada exitosamente!');
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error(error.response?.data?.message || 'Error al crear reserva');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setStep(1);
    setFormData({
      agency_id: 1,
      client_name: '',
      client_email: '',
      client_phone: '',
      client_company: '',
      event_type: '',
      event_date: '',
      event_start_time: '',
      event_duration_hours: 4,
      event_location: '',
      event_description: '',
      estimated_guests: '',
      services_requested: [],
      budget_range: ''
    });
    setErrors({});
    setAvailabilityStatus(null);
    setReservationNumber('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Reserva tu Evento
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Completa el formulario y nos pondremos en contacto contigo
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
            }`}>
              1
            </div>
            <div className={`w-24 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
            }`}>
              2
            </div>
            <div className={`w-24 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-600'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCheckAvailability();
            }}>
              {/* Client Information */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Información de Contacto
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="client_name"
                      value={formData.client_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.client_name ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                      placeholder="Juan Pérez"
                    />
                    {errors.client_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="client_email"
                      value={formData.client_email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.client_email ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                      placeholder="juan@ejemplo.com"
                    />
                    {errors.client_email && (
                      <p className="text-red-500 text-sm mt-1">{errors.client_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="client_phone"
                      value={formData.client_phone}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.client_phone ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                      placeholder="+34 600 123 456"
                    />
                    {errors.client_phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.client_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      name="client_company"
                      value={formData.client_company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="Mi Empresa S.L."
                    />
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  Información del Evento
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tipo de Evento *
                    </label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border ${errors.event_type ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                    >
                      <option value="">Selecciona un tipo</option>
                      {eventTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.event_type && (
                      <p className="text-red-500 text-sm mt-1">{errors.event_type}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Fecha del Evento *
                    </label>
                    <input
                      type="date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border ${errors.event_date ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white`}
                    />
                    {errors.event_date && (
                      <p className="text-red-500 text-sm mt-1">{errors.event_date}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hora de Inicio (opcional)
                    </label>
                    <input
                      type="time"
                      name="event_start_time"
                      value={formData.event_start_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Duración (horas)
                    </label>
                    <input
                      type="number"
                      name="event_duration_hours"
                      value={formData.event_duration_hours}
                      onChange={handleChange}
                      min="1"
                      max="24"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Ubicación (opcional)
                    </label>
                    <input
                      type="text"
                      name="event_location"
                      value={formData.event_location}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="Salón de eventos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Invitados Estimados
                    </label>
                    <input
                      type="number"
                      name="estimated_guests"
                      value={formData.estimated_guests}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Descripción del Evento
                    </label>
                    <textarea
                      name="event_description"
                      value={formData.event_description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      placeholder="Cuéntanos más sobre tu evento..."
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Music className="w-6 h-6 text-blue-600" />
                  Servicios Requeridos
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableServices.map((service) => (
                    <label
                      key={service}
                      className="flex items-center gap-2 p-3 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={service}
                        checked={formData.services_requested.includes(service)}
                        onChange={handleChange}
                        className="w-5 h-5"
                      />
                      <span className="text-slate-900 dark:text-white">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Presupuesto Estimado
                </label>
                <select
                  name="budget_range"
                  value={formData.budget_range}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">Selecciona un rango</option>
                  {budgetRanges.map((range) => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-lg font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Verificando disponibilidad...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verificar Disponibilidad y Reservar
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Checking Availability */}
          {step === 2 && (
            <div className="text-center py-12">
              <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Verificando Disponibilidad
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Por favor espera mientras procesamos tu solicitud...
              </p>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                ¡Reserva Creada Exitosamente!
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                Tu número de reserva es:
              </p>
              <div className="inline-block px-8 py-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  #{reservationNumber}
                </p>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
                Hemos recibido tu solicitud de reserva. Nos pondremos en contacto contigo en breve
                para confirmar los detalles y finalizar la reserva.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                Te hemos enviado un email de confirmación a <strong>{formData.client_email}</strong>
              </p>
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Hacer otra reserva
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            ¿Necesitas ayuda? Contáctanos en{' '}
            <a href="mailto:info@intramedia.com" className="text-blue-600 hover:underline">
              info@intramedia.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicBookingForm;
