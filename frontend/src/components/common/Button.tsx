import clsx from 'clsx';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'accent' | 'danger';
  title?: string;
  className?: string;
  type?: 'button' | 'submit';
}

export function Button({
  children,
  onClick,
  active,
  disabled,
  variant = 'default',
  title,
  className,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'min-h-touch min-w-touch px-4 py-2 rounded-lg font-medium text-tool transition-colors',
        'select-none touch-manipulation',
        {
          'bg-board-accent text-white': active || variant === 'accent',
          'bg-red-600 text-white hover:bg-red-700': variant === 'danger' && !active,
          'bg-board-toolbar text-white hover:bg-board-muted': variant === 'default' && !active,
          'opacity-40 cursor-not-allowed': disabled,
        },
        className
      )}
    >
      {children}
    </button>
  );
}
