import { toast } from 'sonner';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationType } from '../types/notification';

interface NotifyOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persist?: boolean; // Whether to save to notification center
  actionUrl?: string; // URL for notification center action
}

class NotificationService {
  private addToStore(
    type: NotificationType,
    title: string,
    message: string,
    actionLabel?: string,
    actionUrl?: string
  ) {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type,
      title,
      message,
      actionLabel,
      actionUrl,
    });
  }

  success(message: string, options?: NotifyOptions) {
    toast.success(message, {
      duration: options?.duration,
      action: options?.action,
    });

    if (options?.persist !== false) {
      this.addToStore(
        'success',
        'Éxito',
        message,
        options?.action?.label || options?.actionUrl ? 'Ver más' : undefined,
        options?.actionUrl
      );
    }
  }

  error(message: string, options?: NotifyOptions) {
    toast.error(message, {
      duration: options?.duration,
      action: options?.action,
    });

    if (options?.persist !== false) {
      this.addToStore(
        'error',
        'Error',
        message,
        options?.action?.label || options?.actionUrl ? 'Ver más' : undefined,
        options?.actionUrl
      );
    }
  }

  warning(message: string, options?: NotifyOptions) {
    toast.warning(message, {
      duration: options?.duration,
      action: options?.action,
    });

    if (options?.persist !== false) {
      this.addToStore(
        'warning',
        'Advertencia',
        message,
        options?.action?.label || options?.actionUrl ? 'Ver más' : undefined,
        options?.actionUrl
      );
    }
  }

  info(message: string, options?: NotifyOptions) {
    toast.info(message, {
      duration: options?.duration,
      action: options?.action,
    });

    if (options?.persist !== false) {
      this.addToStore(
        'info',
        'Información',
        message,
        options?.action?.label || options?.actionUrl ? 'Ver más' : undefined,
        options?.actionUrl
      );
    }
  }

  // Special method for critical alerts that should always persist
  alert(title: string, message: string, actionUrl?: string) {
    toast.error(`${title}: ${message}`, {
      duration: 10000,
    });

    this.addToStore(
      'error',
      title,
      message,
      actionUrl ? 'Revisar' : undefined,
      actionUrl
    );
  }
}

export const notify = new NotificationService();
