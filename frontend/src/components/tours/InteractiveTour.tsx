import { FC, useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TourStep {
  target: string; // CSS selector del elemento
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Texto del botón de acción
  onAction?: () => void;
}

interface InteractiveTourProps {
  tourId: string;
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export const InteractiveTour: FC<InteractiveTourProps> = ({
  tourId,
  steps,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Check if tour was already completed
    const completed = localStorage.getItem(`tour_${tourId}_completed`);
    if (completed === 'true') {
      setIsVisible(false);
      return;
    }

    // Position the tooltip near the target element
    positionTooltip();
  }, [currentStep, tourId]);

  const positionTooltip = () => {
    const step = steps[currentStep];
    if (!step) return;

    const targetElement = document.querySelector(step.target);
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const placement = step.placement || 'bottom';

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'bottom':
        top = rect.bottom + window.scrollY + 10;
        left = rect.left + window.scrollX + rect.width / 2;
        break;
      case 'top':
        top = rect.top + window.scrollY - 10;
        left = rect.left + window.scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX - 10;
        break;
      case 'right':
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.right + window.scrollX + 10;
        break;
    }

    setPosition({ top, left });

    // Highlight the target element
    targetElement.classList.add('tour-highlight');

    // Remove highlight from previous element
    document.querySelectorAll('.tour-highlight').forEach(el => {
      if (el !== targetElement) {
        el.classList.remove('tour-highlight');
      }
    });

    // Scroll into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    // Remove all highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    onSkip?.();
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_${tourId}_completed`, 'true');
    setIsVisible(false);
    // Remove all highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
    onComplete?.();
  };

  const handleAction = () => {
    const step = steps[currentStep];
    if (step.onAction) {
      step.onAction();
    }
    handleNext();
  };

  if (!isVisible || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSkip} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-2xl max-w-md animate-in fade-in slide-in-from-bottom-5"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translate(-50%, 0)'
        }}
      >
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-sm text-gray-500">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-700 mb-6 leading-relaxed">{step.content}</p>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center space-x-2">
              {step.action && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAction}
                >
                  {step.action}
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleNext}
                className="flex items-center space-x-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Finalizar</span>
                  </>
                ) : (
                  <>
                    <span>Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for highlight */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 45;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5),
                      0 0 0 8px rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          animation: pulse-border 2s infinite;
        }

        @keyframes pulse-border {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5),
                        0 0 0 8px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.6),
                        0 0 0 12px rgba(59, 130, 246, 0.3);
          }
        }
      `}</style>
    </>
  );
};
