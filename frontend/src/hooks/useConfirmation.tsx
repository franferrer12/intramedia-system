import { useState, useCallback, ReactNode } from 'react';
import { AlertDialog, AlertType } from '../components/ui/AlertDialog';

interface ConfirmationOptions {
  title: string;
  message: string | ReactNode;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    message: '',
    type: 'confirm',
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleClose = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  }, [resolvePromise]);

  const ConfirmationDialog = useCallback(() => {
    return (
      <AlertDialog
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        type={options.type}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        showCancel={options.showCancel}
      />
    );
  }, [isOpen, options, handleClose, handleConfirm]);

  return {
    confirm,
    ConfirmationDialog,
  };
};

/**
 * Helpers para confirmaciones comunes
 */
export const confirmDelete = (itemName: string = 'este elemento'): ConfirmationOptions => ({
  title: 'Confirmar eliminación',
  message: `¿Estás seguro de que deseas eliminar ${itemName}? Esta acción no se puede deshacer.`,
  type: 'error',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
});

export const confirmAction = (
  action: string,
  details?: string
): ConfirmationOptions => ({
  title: `Confirmar ${action}`,
  message: details || `¿Estás seguro de que deseas ${action}?`,
  type: 'confirm',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
});

export const confirmCancel = (hasChanges: boolean = true): ConfirmationOptions => ({
  title: 'Confirmar cancelación',
  message: hasChanges
    ? 'Tienes cambios sin guardar. ¿Estás seguro de que deseas cancelar?'
    : '¿Estás seguro de que deseas cancelar?',
  type: 'warning',
  confirmText: 'Sí, cancelar',
  cancelText: 'No, continuar',
});

export const showSuccess = (message: string, title: string = '¡Éxito!'): ConfirmationOptions => ({
  title,
  message,
  type: 'success',
  confirmText: 'Aceptar',
  showCancel: false,
});

export const showError = (message: string, title: string = 'Error'): ConfirmationOptions => ({
  title,
  message,
  type: 'error',
  confirmText: 'Aceptar',
  showCancel: false,
});

export const showWarning = (message: string, title: string = 'Advertencia'): ConfirmationOptions => ({
  title,
  message,
  type: 'warning',
  confirmText: 'Entendido',
  showCancel: false,
});

export const showInfo = (message: string, title: string = 'Información'): ConfirmationOptions => ({
  title,
  message,
  type: 'info',
  confirmText: 'Aceptar',
  showCancel: false,
});
