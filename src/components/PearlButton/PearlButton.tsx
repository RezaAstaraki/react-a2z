import * as React from 'react';
import { cn } from '../../utils';

export type PearlButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Styled native button with CSS-driven effects. Deliberately hook-free so it
 * stays a Server Component — do not add "use client" here.
 */
const PearlButton = React.forwardRef<HTMLButtonElement, PearlButtonProps>(
  (
    {
      children = 'Pearl Button',
      className,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn('a2z-pearl-btn', className)}
        {...props}
      >
        <span className="a2z-pearl-btn__wrap">
          <span aria-hidden className="a2z-pearl-btn__glow" />
          <span aria-hidden className="a2z-pearl-btn__shine" />

          <span className="a2z-pearl-btn__label">{children}</span>
        </span>
      </button>
    );
  },
);

PearlButton.displayName = 'PearlButton';

export default PearlButton;
