import { FC, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
}

interface AlertTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
interface AlertDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const Alert: FC<AlertProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  };

  return (
    <div
      className={clsx(
        'relative w-full rounded-lg border p-4',
        variantClasses[variant],
        className
      )}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertTitle: FC<AlertTitleProps> = ({ className, ...props }) => {
  return (
    <h5
      className={clsx('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  );
};

export const AlertDescription: FC<AlertDescriptionProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  );
};
