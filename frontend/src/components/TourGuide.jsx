import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';

/**
 * TourGuide Component
 * Provides interactive step-by-step tours for different sections of the application
 */

const TourGuide = ({ tourId, onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if user has completed this tour before
    const tourCompleted = localStorage.getItem(`tour_${tourId}_completed`);
    if (!tourCompleted && tourId) {
      // Start tour after a short delay
      setTimeout(() => setRun(true), 1000);
    }
  }, [tourId]);

  const handleJoyrideCallback = (data) => {
    const { status, action, index, type } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED]).includes(status)) {
      // Tour finished or skipped
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(`tour_${tourId}_completed`, 'true');
      if (onComplete) onComplete();
    } else if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND]).includes(type)) {
      // Update state to advance the tour
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  const getTourSteps = () => {
    const tours = {
      'dashboard-main': [
        {
          target: '[data-tour="stats-overview"]',
          content: '¡Bienvenido! Aquí puedes ver un resumen rápido de tus métricas principales: eventos, ingresos y pendientes.',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="quick-actions"]',
          content: 'Usa estos botones de acción rápida para crear eventos, añadir clientes o gestionar DJs.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="notifications"]',
          content: 'Las notificaciones te alertan sobre cambios importantes en tus métricas de Instagram.',
          placement: 'left'
        },
        {
          target: '[data-tour="navigation"]',
          content: 'Navega por las diferentes secciones del sistema desde este menú lateral.',
          placement: 'right'
        }
      ],

      'instagram-analytics': [
        {
          target: '[data-tour="ig-tabs"]',
          content: 'Explora 5 pestañas diferentes: Resumen, Contenido, Crecimiento, Insights y Predicciones.',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="ig-refresh"]',
          content: 'Actualiza tus métricas desde Instagram cuando quieras ver datos frescos.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="ig-export"]',
          content: 'Exporta un reporte completo en PDF con todas tus estadísticas.',
          placement: 'left'
        },
        {
          target: '[data-tour="ig-metrics"]',
          content: 'Aquí ves tus métricas principales: seguidores, engagement, posts y más.',
          placement: 'top'
        },
        {
          target: '[data-tour="ig-predictions"]',
          content: '¡Importante! Las predicciones usan ML para proyectar tu crecimiento y recomendar mejoras.',
          placement: 'top'
        }
      ],

      'events-management': [
        {
          target: '[data-tour="create-event"]',
          content: 'Crea un nuevo evento haciendo clic aquí. Podrás configurar fecha, cliente, DJs y precios.',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="events-filters"]',
          content: 'Filtra eventos por estado: pendientes, confirmados, completados o cancelados.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="event-card"]',
          content: 'Cada tarjeta muestra información clave del evento y acciones rápidas.',
          placement: 'top'
        },
        {
          target: '[data-tour="event-status"]',
          content: 'El estado del evento se muestra con colores: amarillo (pendiente), verde (confirmado), azul (completado).',
          placement: 'left'
        }
      ],

      'dj-comparison': [
        {
          target: '[data-tour="dj-selection"]',
          content: 'Selecciona hasta 10 DJs para comparar sus métricas de Instagram.',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="compare-button"]',
          content: 'Haz clic en "Comparar" para analizar el rendimiento de los DJs seleccionados.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="rankings"]',
          content: 'Aquí verás los rankings: más seguidores, mejor engagement y mejor ratio.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="comparison-table"]',
          content: 'La tabla detallada te permite comparar todas las métricas lado a lado.',
          placement: 'top'
        }
      ],

      'predictions': [
        {
          target: '[data-tour="data-quality"]',
          content: 'La calidad de predicción depende de cuántos datos históricos tengamos.',
          disableBeacon: true,
          placement: 'bottom'
        },
        {
          target: '[data-tour="projections"]',
          content: 'Aquí vemos proyecciones a 30 días de tus seguidores y engagement.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="growth-trends"]',
          content: 'Analiza tendencias de crecimiento y engagement para entender tu evolución.',
          placement: 'bottom'
        },
        {
          target: '[data-tour="optimal-times"]',
          content: 'El sistema recomienda los mejores horarios y días para publicar basándose en tu historial.',
          placement: 'top'
        },
        {
          target: '[data-tour="hashtag-performance"]',
          content: 'Descubre qué hashtags funcionan mejor para tu contenido.',
          placement: 'top'
        },
        {
          target: '[data-tour="recommendations"]',
          content: 'Recibe recomendaciones personalizadas para mejorar tu estrategia de contenido.',
          placement: 'top'
        }
      ]
    };

    return tours[tourId] || [];
  };

  const steps = getTourSteps();

  if (!tourId || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#9333ea', // purple-600
          textColor: '#1f2937', // gray-800
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          arrowColor: '#ffffff',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          fontSize: 14,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: 'left'
        },
        buttonNext: {
          backgroundColor: '#9333ea',
          fontSize: 14,
          padding: '8px 16px',
          borderRadius: 8,
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: 14,
          padding: '8px 16px',
        },
        buttonSkip: {
          color: '#9ca3af',
          fontSize: 13,
        },
        beacon: {
          display: 'none' // Hide beacons, auto-start instead
        }
      }}
      locale={{
        back: 'Atrás',
        close: 'Cerrar',
        last: 'Finalizar',
        next: 'Siguiente',
        skip: 'Saltar tour'
      }}
    />
  );
};

// Hook to trigger specific tours
export const useTour = () => {
  const [activeTour, setActiveTour] = useState(null);

  const startTour = (tourId) => {
    // Remove the completion flag to allow restarting tours
    localStorage.removeItem(`tour_${tourId}_completed`);
    setActiveTour(tourId);
  };

  const resetTour = (tourId) => {
    localStorage.removeItem(`tour_${tourId}_completed`);
  };

  const resetAllTours = () => {
    const tourIds = [
      'dashboard-main',
      'instagram-analytics',
      'events-management',
      'dj-comparison',
      'predictions'
    ];
    tourIds.forEach(id => localStorage.removeItem(`tour_${id}_completed`));
  };

  return {
    activeTour,
    startTour,
    resetTour,
    resetAllTours,
    TourComponent: activeTour ? <TourGuide tourId={activeTour} onComplete={() => setActiveTour(null)} /> : null
  };
};

export default TourGuide;
