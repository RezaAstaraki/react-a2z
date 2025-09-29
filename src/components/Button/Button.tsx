import * as React from 'react';
import { cn } from '../../utils';

type ButtonVariant =
  | 'filled-blue'
  | 'outlined-blue'
  | 'text-blue'
  | 'filled-gray'
  | 'outlined-white'
  | 'text-white';

type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
type ButtonType = 'text' | 'icon-only';
type IconPosition = 'left' | 'right' | 'center';

const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('animate-spin', className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  buttonType?: ButtonType;
  text?: string;
  icon?: React.ReactNode;
  iconPosition?: IconPosition;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'filled-blue',
      size = 'md',
      buttonType = 'text',
      text = 'متن دکمه',
      icon,
      iconPosition = 'center',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    const displayText = buttonType === 'icon-only' ? '' : text;

    // all classes inline instead of getButtonVariants()
    const baseClasses =
      'inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-md font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

    const variantClasses: Record<ButtonVariant, string> = {
      'filled-blue':
        'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:ring-blue-500',
      'outlined-blue':
        'border border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 focus-visible:ring-blue-500',
      'text-blue': 'text-blue-600 bg-transparent hover:bg-blue-50 focus-visible:ring-blue-500',
      'filled-gray':
        'bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300 focus-visible:ring-gray-500',
      'outlined-white':
        'border border-white text-white bg-transparent hover:bg-white/10 focus-visible:ring-white',
      'text-white': 'text-white bg-transparent hover:bg-white/10 focus-visible:ring-white',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      xs: 'text-xs px-2 py-1 h-6',
      sm: 'text-sm px-3 py-1.5 h-8',
      md: 'text-base px-4 py-2 h-10',
      lg: 'text-lg px-6 py-3 h-12',
    };

    const typeClasses: Record<ButtonType, string> = {
      text: 'rounded-md',
      'icon-only': 'rounded-md aspect-square',
    };

    const iconSize = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    }[size];

    const renderIcon = (Icon: React.ReactNode) => {
      return loading ? <LoadingSpinner className={iconSize} /> : Icon;
    };

    const renderContent = () => {
      if (buttonType === 'icon-only') {
        return icon ? renderIcon(icon) : null;
      }

      if (!icon) {
        return displayText;
      }

      const iconElement = renderIcon(icon);

      switch (iconPosition) {
        case 'left':
          return (
            <>
              {iconElement}
              {displayText}
            </>
          );
        case 'right':
          return (
            <>
              {displayText}
              {iconElement}
            </>
          );
        case 'center':
        default:
          return (
            <>
              {iconElement}
              {displayText}
              {iconElement}
            </>
          );
      }
    };

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          typeClasses[buttonType],
          className,
        )}
        ref={ref}
        disabled={isDisabled}
        aria-label={buttonType === 'icon-only' && icon ? `${icon} button` : undefined}
        {...props}
      >
        {children || renderContent()}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonType, IconPosition };
