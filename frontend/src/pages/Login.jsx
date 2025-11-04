import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Music, Mail, Lock, User, Phone, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Alert } from '../components';

/**
 * Login/Register Page - Multi-Tenant System
 * Supports Agencies and Individual DJs
 */

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [userType, setUserType] = useState('agency'); // 'agency' or 'individual_dj'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    // Agency fields
    agencyName: '',
    legalName: '',
    taxId: '',
    contactPerson: '',
    phone: '',
    // Individual DJ fields
    nombre: '',
    telefono: ''
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Email y contraseña son requeridos');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    if (mode === 'register') {
      if (formData.password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }

      if (userType === 'agency') {
        if (!formData.agencyName) {
          setError('El nombre de la agencia es requerido');
          return false;
        }
      } else if (userType === 'individual_dj') {
        if (!formData.nombre) {
          setError('El nombre artístico es requerido');
          return false;
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(formData.email, formData.password);

        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      } else {
        // Register
        const userData = {
          email: formData.email,
          password: formData.password,
          userType,
          ...(userType === 'agency' ? {
            agencyName: formData.agencyName,
            legalName: formData.legalName,
            taxId: formData.taxId,
            contactPerson: formData.contactPerson,
            phone: formData.phone
          } : {
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono
          })
        };

        const result = await register(userData);

        if (result.success) {
          navigate('/');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      agencyName: '',
      legalName: '',
      taxId: '',
      contactPerson: '',
      phone: '',
      nombre: '',
      telefono: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left Side - Branding */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-12 text-white hidden md:flex flex-col justify-center">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Music className="w-12 h-12" />
                  <div>
                    <h1 className="text-3xl font-bold">Intra Media</h1>
                    <p className="text-primary-100">Sistema de Gestión</p>
                  </div>
                </div>

                <div className="space-y-4 mt-8">
                  <h2 className="text-2xl font-semibold">
                    {mode === 'login' ? '¡Bienvenido de nuevo!' : '¡Únete a nosotros!'}
                  </h2>
                  <p className="text-primary-100">
                    {mode === 'login'
                      ? 'Gestiona tu agencia o carrera como DJ desde un solo lugar'
                      : 'Comienza a gestionar tu carrera musical de forma profesional'
                    }
                  </p>

                  <div className="space-y-3 mt-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">✓</span>
                      </div>
                      <span>Gestión completa de eventos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">✓</span>
                      </div>
                      <span>Análisis de redes sociales</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">✓</span>
                      </div>
                      <span>Control financiero detallado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-12">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {mode === 'login'
                      ? 'Ingresa tus credenciales para continuar'
                      : 'Completa tus datos para comenzar'
                    }
                  </p>
                </div>

                {/* User Type Selection (only for register) */}
                {mode === 'register' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ¿Qué tipo de cuenta deseas crear?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setUserType('agency')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                          userType === 'agency'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Building2 className={`w-8 h-8 ${
                          userType === 'agency' ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          userType === 'agency' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          Agencia
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Gestiono varios artistas
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserType('individual_dj')}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                          userType === 'individual_dj'
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Music className={`w-8 h-8 ${
                          userType === 'individual_dj' ? 'text-primary-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          userType === 'individual_dj' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          DJ Individual
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                          Me gestiono yo mismo
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <Alert variant="error" dismissible onDismiss={() => setError('')}>
                    {error}
                  </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Additional fields for Agency registration */}
                  {mode === 'register' && userType === 'agency' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre de la Agencia *
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="agencyName"
                            value={formData.agencyName}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Mi Agencia Musical"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Razón Social
                          </label>
                          <input
                            type="text"
                            name="legalName"
                            value={formData.legalName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="Agencia S.L."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            NIF/CIF
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="taxId"
                              value={formData.taxId}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="B12345678"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Persona de Contacto
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="contactPerson"
                              value={formData.contactPerson}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Juan Pérez"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Teléfono
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="+34 600 000 000"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Additional fields for Individual DJ registration */}
                  {mode === 'register' && userType === 'individual_dj' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nombre Artístico *
                        </label>
                        <div className="relative">
                          <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="DJ Example"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Teléfono
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            placeholder="+34 600 000 000"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        placeholder="••••••••"
                        required
                        minLength={mode === 'register' ? 8 : undefined}
                      />
                    </div>
                    {mode === 'register' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Mínimo 8 caracteres
                      </p>
                    )}
                  </div>

                  {/* Confirm Password (only for register) */}
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirmar Contraseña
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-lg font-medium hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
                    )}
                  </button>

                  {/* Toggle Mode */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      {mode === 'login'
                        ? '¿No tienes cuenta? Regístrate aquí'
                        : '¿Ya tienes cuenta? Inicia sesión'
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 text-sm">
          <p>© 2025 Intra Media System. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
