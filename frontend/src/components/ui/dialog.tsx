import { FC, HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {}
interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {}
interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const Dialog: FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
};

export const DialogContent: FC<DialogContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'relative z-50 bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  );
};

export const DialogHeader: FC<DialogHeaderProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
};

export const DialogFooter: FC<DialogFooterProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  );
};

export const DialogTitle: FC<DialogTitleProps> = ({
  className,
  ...props
}) => {
  return (
    <h2
      className={clsx(
        'text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
};

export const DialogDescription: FC<DialogDescriptionProps> = ({
  className,
  ...props
}) => {
  return (
    <p
      className={clsx('text-sm text-gray-500', className)}
      {...props}
    />
  );
};
