import * as React from 'react';
import { forwardRef } from 'react';
import { cn } from '../../utils';

export type InputSize = 'sm' | 'md' | 'lg';

/**
 * Overridable parts.
 *
 * `Input` is deliberately hook-free (it stays a Server Component), so it cannot
 * call `useId` to wire `<label htmlFor>` for you. Pass `id` to get the label
 * association and `aria-describedby`. Without it an enclosing label provides
 * the association, and aria-description provides the helper/error text.
 */
export type InputClassNames = {
  root?: string;
  label?: string;
  /** Positioning context for the adornments. */
  wrapper?: string;
  input?: string;
  startIcon?: string;
  endIcon?: string;
  /** The `<div>` holding the helper/error text. */
  helper?: string;
  /** Each message `<p>` (error and helper share this slot). */
  helperText?: string;
};

export type InputStyles = {
  root?: React.CSSProperties;
  label?: React.CSSProperties;
  wrapper?: React.CSSProperties;
  input?: React.CSSProperties;
  startIcon?: React.CSSProperties;
  endIcon?: React.CSSProperties;
  helper?: React.CSSProperties;
  helperText?: React.CSSProperties;
};

export type InputProps = {
  /** Visible field label. Uses an enclosing label when id is omitted. */
  label?: string;
  /** Native placeholder, shown only when the field is empty. */
  placeholder?: string;
  /** Shown as the error message and forces the invalid visual state. */
  error?: string;
  /** @deprecated Use `error`. */
  errorMessage?: string;
  /** Helper copy below the field. Hidden while `error` is set. */
  helperText?: string;
  /** Control height and text size. Default `md`. */
  size?: InputSize;
  /** Disables the field and applies the disabled styles. */
  disabled?: boolean;
  /** @deprecated Use the native `readOnly`. */
  readonly?: boolean;
  /** Marks the field required for form validation and a11y. */
  required?: boolean;
  /** Forces the invalid visual state without an error message. */
  isInvalid?: boolean;
  /** Extra classes on the root wrapper. Merged after `classNames.root`, so it wins. */
  className?: string;
  /** @deprecated Use `classNames.input`. */
  inputClassName?: string;
  /** @deprecated Use `classNames.label`. */
  labelClassName?: string;
  /** Per-slot class overrides: `root | label | wrapper | input | startIcon | endIcon | helper | helperText`. */
  classNames?: InputClassNames;
  /** Per-slot inline styles, same slots as `classNames`. */
  styles?: InputStyles;
  /** Adornment inside the field, on the inline-start edge. */
  startIcon?: React.ReactNode;
  /** Adornment inside the field, on the inline-end edge. */
  endIcon?: React.ReactNode;
  /** Native input type. Default `text`. */
  type?: string;
  /** Native max length. */
  maxLength?: number;
  /** Fires on every input event, like the native `onInput`. */
  onInput?: (e: React.FormEvent<HTMLInputElement>) => void;
  /** Renders a currency-affix label on the inline-start edge. */
  currency?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

const SIZES: Record<InputSize, { input: string; label: string; helper: string }> = {
  sm: { input: 'px-3 py-2 text-sm', label: 'text-xs', helper: 'text-xs' },
  md: { input: 'px-4 py-3 text-sm', label: 'text-sm', helper: 'text-xs' },
  lg: { input: 'px-4 py-4 text-base', label: 'text-sm', helper: 'text-sm' },
};

/**
 * Styled native input. Deliberately hook-free so it stays a Server Component and
 * adds nothing to the client bundle — pass `id` (as you would on a native input)
 * to get the `<label htmlFor>` and `aria-describedby` wiring.
 *
 * Colours come from design tokens, so the field re-skins when a consumer
 * overrides `--a2z-*` variables, or per instance via `classNames` / `styles`.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    placeholder,
    error,
    errorMessage,
    helperText,
    size = 'md',
    disabled = false,
    readonly = false,
    required = false,
    isInvalid = false,
    className,
    inputClassName,
    labelClassName,
    classNames,
    styles,
    startIcon,
    endIcon,
    type = 'text',
    maxLength,
    onInput,
    currency,
    id,
    readOnly,
    'aria-describedby': describedBy,
    'aria-description': ariaDescription,
    'aria-invalid': ariaInvalid,
    ...props
  },
  ref
) {
  // An explicit `id` is what makes the label association and described-by
  // reference possible without a client-side hook.
  const messageId = id ? `${id}-message` : undefined;

  const displayError = error || errorMessage;
  const hasError = isInvalid || !!displayError;
  const hasMessage = !!displayError || !!helperText;
  const isReadOnly = readOnly ?? readonly;

  const sizeTokens = SIZES[size];

  const inputClasses = cn(
    'w-full transition-colors duration-200 ease-a2z focus:outline-none',
    'rounded-lg border bg-surface text-fg placeholder:text-fg-subtle',
    'focus-visible:ring-1 focus-visible:ring-offset-0',
    // Invalid last so it wins over the resting border colour.
    hasError
      ? 'border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500'
      : 'border-border focus-visible:border-primary-500 focus-visible:ring-primary-500',
    'disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-fg disabled:border-disabled',
    isReadOnly && 'cursor-default bg-surface-sunken',
    sizeTokens.input,
    startIcon || currency ? 'ps-10' : undefined,
    endIcon && 'pe-10',
    classNames?.input,
    inputClassName
  );

  const labelClasses = cn(
    'block font-medium text-fg text-start mb-2',
    required && "after:content-['*'] after:text-danger-500 after:ms-1",
    disabled && 'text-fg-subtle',
    hasError && 'text-danger-600',
    sizeTokens.label,
    classNames?.label,
    labelClassName
  );

  const helperTextClasses = cn(
    'text-start',
    sizeTokens.helper,
    hasError ? 'text-danger-600' : disabled ? 'text-fg-subtle' : 'text-fg-muted',
    classNames?.helperText
  );

  const adornmentBase =
    'pointer-events-none absolute top-1/2 -translate-y-1/2 flex items-center text-fg-subtle';

  const Root = label && !id ? 'label' : 'div';
  const Label = id ? 'label' : 'span';

  return (
    <div className={cn('w-full', classNames?.root, className)} style={styles?.root}>
      <Root className="block">
        {label && (
          <Label htmlFor={id} className={labelClasses} style={styles?.label}>
            {label}
          </Label>
        )}

        <span className={cn('relative block', classNames?.wrapper)} style={styles?.wrapper}>
          {startIcon && (
            <span
              aria-hidden="true"
              className={cn(adornmentBase, 'start-3', classNames?.startIcon)}
              style={styles?.startIcon}
            >
              {startIcon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            type={type}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={isReadOnly}
            maxLength={maxLength}
            onInput={onInput}
            required={required}
            aria-required={required || undefined}
            aria-invalid={hasError || ariaInvalid || undefined}
            aria-describedby={
              [describedBy, hasMessage && messageId].filter(Boolean).join(' ') || undefined
            }
            aria-description={
              ariaDescription ?? (!id && hasMessage ? displayError || helperText : undefined)
            }
            className={inputClasses}
            style={styles?.input}
            {...props}
          />

          {currency && !startIcon && (
            <span
              aria-hidden="true"
              className={cn(adornmentBase, 'start-3 text-sm', classNames?.startIcon)}
              style={styles?.startIcon}
            >
              {currency}
            </span>
          )}

          {endIcon && (
            <span
              aria-hidden="true"
              className={cn(adornmentBase, 'end-3', classNames?.endIcon)}
              style={styles?.endIcon}
            >
              {endIcon}
            </span>
          )}
        </span>
      </Root>
      {hasMessage && (
        <div className={cn('mt-1', classNames?.helper)} style={styles?.helper} id={messageId}>
          {displayError && (
            <p className={helperTextClasses} style={styles?.helperText}>
              {displayError}
            </p>
          )}
          {helperText && !displayError && (
            <p className={helperTextClasses} style={styles?.helperText}>
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
export { Input };
