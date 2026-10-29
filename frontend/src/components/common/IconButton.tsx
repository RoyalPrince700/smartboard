import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'accent' | 'danger';
  size?: 'sm' | 'md';
  type?: 'button' | 'submit';
  className?: string;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  variant = 'default',
  size = 'md',
  type = 'button',
  className,
}: IconButtonProps) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        dim,
        'rounded-full flex items-center justify-center transition-colors touch-manipulation shrink-0',
        {
          'bg-neutral-900 text-white': active || variant === 'accent',
          'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800':
            variant === 'danger' && !active,
          'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900':
            variant === 'default' && !active,
          'opacity-40 cursor-not-allowed': disabled,
        },
        className
      )}
    >
      <Icon size={iconSize} strokeWidth={2} />
    </button>
  );
}
