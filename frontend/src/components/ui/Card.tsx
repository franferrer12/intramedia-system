import { FC, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={clsx('bg-white rounded-lg shadow-md border border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('px-6 py-4 border-b border-gray-200', className)} {...props}>
      {children}
    </div>
  );
};

export const CardBody: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('px-6 py-4 border-t border-gray-200 bg-gray-50', className)} {...props}>
      {children}
    </div>
  );
};

export const CardContent: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div className={clsx('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <h3 className={clsx('text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <p className={clsx('text-sm text-gray-600 mt-1', className)} {...props}>
      {children}
    </p>
  );
};
