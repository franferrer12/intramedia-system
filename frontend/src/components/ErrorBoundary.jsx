import { Component } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { announceToScreenReader } from '../utils/accessibility';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 * WCAG 2.1 compliant with screen reader support
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Update state
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Announce error to screen readers
    announceToScreenReader(
      'Ha ocurrido un error. Por favor, recarga la página o contacta con soporte.',
      'assertive'
    );

    // Send error to monitoring service (if configured)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call custom reset handler
    if (this.props.onReset) {
      this.props.onReset();
    }

    announceToScreenReader('La página ha sido reiniciada correctamente', 'polite');
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset,
        });
      }

      // Default fallback UI
      const { level = 'full', showDetails = process.env.NODE_ENV === 'development' } = this.props;

      if (level === 'minimal') {
        return (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md bg-red-50 dark:bg-red-900/20 p-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Ha ocurrido un error al cargar este componente.
                </p>
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        );
      }

      // Full page error UI
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4"
        >
          <div className="max-w-xl w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <ExclamationTriangleIcon
                className="h-10 w-10 text-red-600 dark:text-red-400"
                aria-hidden="true"
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
              ¡Ups! Algo salió mal
            </h1>

            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {this.state.errorCount > 3
                ? 'Parece que este error persiste. Por favor, contacta con soporte técnico.'
                : 'Ha ocurrido un error inesperado. Puedes intentar recargar la página o volver atrás.'}
            </p>

            {showDetails && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                <summary className="cursor-pointer font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Detalles técnicos
                </summary>
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <p>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="mt-2 overflow-auto text-xs bg-white dark:bg-gray-800 p-2 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <ArrowPathIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Intentar de nuevo
              </button>

              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Recargar página
              </button>
            </div>

            {this.state.errorCount > 3 && (
              <div className="mt-6 text-center">
                <a
                  href="mailto:support@intramedia.com"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Contactar con soporte técnico
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary for lazy-loaded components
 */
export class AsyncErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Async loading error:', error, errorInfo);
    announceToScreenReader('Error al cargar el componente', 'assertive');
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true });

    // Wait a bit before retrying
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.setState({
      hasError: false,
      isRetrying: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="min-h-[400px] flex items-center justify-center p-8"
        >
          <div className="text-center">
            <ExclamationTriangleIcon
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
              aria-hidden="true"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error al cargar el módulo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              No se pudo cargar este componente. Verifica tu conexión a internet.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              disabled={this.state.isRetrying}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {this.state.isRetrying ? (
                <>
                  <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" aria-hidden="true" />
                  Reintentando...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                  Reintentar
                </>
              )}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use error boundary in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);

  if (error) {
    throw error;
  }

  return setError;
};

export default ErrorBoundary;
