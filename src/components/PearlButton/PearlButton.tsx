import * as React from 'react';
import { cn } from '../../utils';

export type PearlButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
};

const PearlButton = React.forwardRef<HTMLButtonElement, PearlButtonProps>(
  (
    {
      children = 'Pearl Button',
      icon,
      hoverIcon,
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

          <span className="a2z-pearl-btn__label">
            <span className="a2z-pearl-btn__icon">
              <span className="a2z-pearl-btn__icon--idle">{icon ?? '✧'}</span>
              <span className="a2z-pearl-btn__icon--hover">
                {hoverIcon ?? '✦'}
              </span>
            </span>
            {children}
          </span>
        </span>
      </button>
    );
  },
);

PearlButton.displayName = 'PearlButton';

export default PearlButton;
