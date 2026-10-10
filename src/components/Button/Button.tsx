import * as React from 'react';
import { cn } from '../../utils';

/** Visual treatment. Orthogonal to `color`. */
export type ButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'link';
/** Semantic intent. Orthogonal to `variant`. */
export type ButtonColor = 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';
/** `icon-only` renders a square and suppresses text. */
export type ButtonShape = 'text' | 'icon-only';
export type IconPosition = 'left' | 'right' | 'both';

/**
 * Overridable parts. Declaration order is irrelevant — `cn` merges with
 * last-one-wins per CSS property group, so a slot class you pass here always
 * beats the variant default for the property you set.
 */
export type ButtonClassNames = {
  root?: string;
  text?: string;
  icon?: string;
  spinner?: string;
};

export type ButtonStyles = {
  root?: React.CSSProperties;
  text?: React.CSSProperties;
  icon?: React.CSSProperties;
  spinner?: React.CSSProperties;
};

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Visual treatment. Default `solid`. Pairs with `color`. */
  variant?: ButtonVariant;
  /** Semantic intent. Default `primary`. Pairs with `variant`. */
  color?: ButtonColor;
  /** Control height and text size. Default `md`. */
  size?: ButtonSize;
  /** `icon-only` renders `aspect-square` and hides `text`/`children`. */
  shape?: ButtonShape;
  /** @deprecated Use `shape`. Kept accepting the old name for one major. */
  buttonType?: ButtonShape;
  /** Label text. Ignored when `children` is set, and hidden by `shape="icon-only"`. */
  text?: string;
  /** Icon element. Positioned by `iconPosition`. */
  icon?: React.ReactNode;
  /** Use `both` to flank the label with the icon on each side. */
  iconPosition?: IconPosition;
  /**
   * Shows a spinner and disables the button. Applies the disabled styles, so
   * `color` has no visible effect until loading finishes.
   */
  loading?: boolean;
  /** Replaces the default spinner. */
  loadingIcon?: React.ReactNode;
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Per-slot class overrides: `root | text | icon | spinner`. */
  classNames?: ButtonClassNames;
  /** Per-slot inline styles, same slots as `classNames`. */
  styles?: ButtonStyles;
}

const Spinner = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    className={cn('animate-spin', className)}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const SIZES: Record<ButtonSize, { root: string; text: string; icon: string }> = {
  xs: { root: 'h-6 px-2 gap-1', text: 'text-xs', icon: 'size-3' },
  sm: { root: 'h-8 px-3 gap-1.5', text: 'text-sm', icon: 'size-4' },
  md: { root: 'h-10 px-4 gap-2', text: 'text-sm', icon: 'size-5' },
  lg: { root: 'h-12 px-6 gap-2.5', text: 'text-base', icon: 'size-6' },
};

/** Per-color foreground/background pairs, driven entirely by token utilities. */
const COLORS: Record<ButtonColor, { solid: string; soft: string; outline: string; ghost: string }> = {
  primary: {
    solid: 'bg-primary-600 text-primary-fg hover:bg-primary-700',
    soft: 'bg-primary-soft text-primary-700 hover:bg-primary-soft-hover',
    outline: 'border border-primary-600 text-primary-700 hover:bg-primary-soft',
    ghost: 'text-primary-700 hover:bg-primary-soft',
  },
  neutral: {
    solid: 'bg-neutral-600 text-neutral-fg hover:bg-neutral-700',
    soft: 'bg-neutral-soft text-neutral-700 hover:bg-neutral-soft-hover',
    outline: 'border border-border-strong text-fg hover:bg-neutral-soft',
    ghost: 'text-fg hover:bg-neutral-soft',
  },
  success: {
    solid: 'bg-success-600 text-success-fg hover:bg-success-700',
    soft: 'bg-success-soft text-success-700 hover:bg-success-soft-hover',
    outline: 'border border-success-600 text-success-700 hover:bg-success-soft',
    ghost: 'text-success-700 hover:bg-success-soft',
  },
  warning: {
    solid: 'bg-warning-600 text-warning-fg hover:bg-warning-700',
    soft: 'bg-warning-soft text-warning-700 hover:bg-warning-soft-hover',
    outline: 'border border-warning-600 text-warning-700 hover:bg-warning-soft',
    ghost: 'text-warning-700 hover:bg-warning-soft',
  },
  danger: {
    solid: 'bg-danger-600 text-danger-fg hover:bg-danger-700',
    soft: 'bg-danger-soft text-danger-700 hover:bg-danger-soft-hover',
    outline: 'border border-danger-600 text-danger-700 hover:bg-danger-soft',
    ghost: 'text-danger-700 hover:bg-danger-soft',
  },
  info: {
    solid: 'bg-info-600 text-info-fg hover:bg-info-700',
    soft: 'bg-info-soft text-info-700 hover:bg-info-soft-hover',
    outline: 'border border-info-600 text-info-700 hover:bg-info-soft',
    ghost: 'text-info-700 hover:bg-info-soft',
  },
};

/** Ring color must track `color`, not `variant`. */
const RINGS: Record<ButtonColor, string> = {
  primary: 'focus-visible:ring-primary-500',
  neutral: 'focus-visible:ring-neutral-500',
  success: 'focus-visible:ring-success-500',
  warning: 'focus-visible:ring-warning-500',
  danger: 'focus-visible:ring-danger-500',
  info: 'focus-visible:ring-info-500',
};

/**
 * Styled native button.
 *
 * Deliberately hook-free so it stays a Server Component — do not add
 * `"use client"` here; add it at your call site if you pass handlers.
 *
 * Every visual decision routes through a design token, so a consumer can
 * re-skin it two ways without forking: override the CSS variables
 * (`--a2z-primary-600`) to move the whole library at once, or override a single
 * instance through `classNames` / `styles` / `className`.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'solid',
    color = 'primary',
    size = 'md',
    shape,
    buttonType,
    text = 'متن دکمه',
    icon,
    iconPosition = 'left',
    loading = false,
    loadingIcon,
    fullWidth = false,
    classNames,
    styles,
    style,
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref,
) {
  const resolvedShape = shape ?? buttonType ?? 'text';
  const isIconOnly = resolvedShape === 'icon-only';
  const isDisabled = disabled || loading;

  const sizeTokens = SIZES[size];
  const palette = COLORS[color];
  const surface = variant === 'link' ? '' : palette[variant];

  const rootClasses = cn(
    // Structure and behaviour — variant-independent.
    'relative inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium',
    'transition-colors duration-200 ease-a2z cursor-pointer select-none',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset',
    RINGS[color],
    // Disabled state via tokens, so `--a2z-disabled-*` re-themes it.
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-fg disabled:border-disabled disabled:shadow-none',
    sizeTokens.root,
    fullWidth && 'w-full',
    isIconOnly && 'aspect-square px-0',
    variant === 'link' && 'h-auto p-0 underline-offset-4 hover:underline',
    surface,
    loading && 'cursor-wait',
    classNames?.root,
    className,
  );

  const textClasses = cn(sizeTokens.text, variant === 'link' && 'underline-offset-4', classNames?.text);
  const iconClasses = cn('shrink-0', sizeTokens.icon, classNames?.icon);
  const spinnerClasses = cn('shrink-0', sizeTokens.icon, classNames?.spinner);

  const renderedIcon = loading ? (
    loadingIcon ?? <Spinner className={spinnerClasses} style={styles?.spinner} />
  ) : (
    icon
  );

  const iconNode = renderedIcon ? (
    <span className={iconClasses} style={styles?.icon} aria-hidden={isIconOnly ? undefined : true}>
      {renderedIcon}
    </span>
  ) : null;

  const label = isIconOnly ? null : (children ?? text);

  const content = (() => {
    if (isIconOnly) return iconNode;
    if (!iconNode) {
      return (
        <span className={textClasses} style={styles?.text}>
          {label}
        </span>
      );
    }
    if (iconPosition === 'right') {
      return (
        <>
          <span className={textClasses} style={styles?.text}>
            {label}
          </span>
          {iconNode}
        </>
      );
    }
    if (iconPosition === 'both') {
      return (
        <>
          {iconNode}
          <span className={textClasses} style={styles?.text}>
            {label}
          </span>
          {iconNode}
        </>
      );
    }
    return (
      <>
        {iconNode}
        <span className={textClasses} style={styles?.text}>
          {label}
        </span>
      </>
    );
  })();

  return (
    <button
      ref={ref}
      type={type}
      className={rootClasses}
      style={{ ...styles?.root, ...style }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
export { Button };
