'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipClassNames {
  root?: string;
  trigger?: string;
  content?: string;
  arrow?: string;
}

export interface TooltipStyles {
  root?: React.CSSProperties;
  trigger?: React.CSSProperties;
  content?: React.CSSProperties;
  arrow?: React.CSSProperties;
}

export interface TooltipContentRenderProps {
  ref: React.Ref<HTMLDivElement>;
  className: string;
  style: React.CSSProperties;
  placement: TooltipPlacement;
  side: TooltipPlacement;
  open: boolean;
  contentId: string;
}

export interface TooltipProps {
  /* Controlled + uncontrolled */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;

  /**
   * Shorthand API. When provided, `children` is wrapped automatically with
   * `<Tooltip.Trigger>` and this node is rendered inside `<Tooltip.Content>`.
   * Omit it to use the compound API (`Tooltip.Trigger` + `Tooltip.Content`).
   */
  content?: React.ReactNode;

  placement?: TooltipPlacement;
  /** Distance in px between trigger and content. Defaults to 8. */
  offset?: number;
  /** Delay in ms before showing on hover. Defaults to 150. */
  delayDuration?: number;
  /** Delay in ms before hiding after pointer leaves. Defaults to 80. */
  closeDelay?: number;
  disabled?: boolean;
  showArrow?: boolean;
  /** Portal target. Defaults to `document.body`. */
  container?: HTMLElement | null;

  className?: string;
  classNames?: TooltipClassNames;
  style?: React.CSSProperties;
  styles?: TooltipStyles;

  children?: React.ReactNode;
}

export interface TooltipTriggerProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface TooltipContentProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Override the root placement. */
  side?: TooltipPlacement;
  /** Override the root offset. */
  sideOffset?: number;
  /** Render prop escape hatch. */
  render?: (props: TooltipContentRenderProps) => React.ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Default classes                                                    */
/* ------------------------------------------------------------------ */

const DEFAULT_TRIGGER =
  'inline-flex items-center focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ' +
  'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50';

const DEFAULT_CONTENT =
  'pointer-events-none z-50 max-w-xs rounded-md bg-gray-900 px-2.5 py-1.5 ' +
  'text-xs font-medium leading-snug text-white shadow-md ' +
  'transition-opacity duration-100';

const DEFAULT_ARROW = 'pointer-events-none absolute h-2 w-2 rotate-45 bg-gray-900';

/* ------------------------------------------------------------------ */
/*  Hooks / utils                                                      */
/* ------------------------------------------------------------------ */

function useControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
}: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState<T>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? (controlledValue as T) : uncontrolled;

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function composeHandlers<E extends React.SyntheticEvent>(
  ...handlers: Array<((event: E) => void) | undefined>
): (event: E) => void {
  return (event) => {
    for (const handler of handlers) handler?.(event);
  };
}

const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface TooltipContextValue {
  open: boolean;
  disabled: boolean;
  placement: TooltipPlacement;
  offset: number;
  showArrow: boolean;
  container: HTMLElement | null;
  classNames?: TooltipClassNames;
  styles?: TooltipStyles;
  triggerRef: React.RefObject<HTMLSpanElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  contentId: string;
  openNow: () => void;
  openWithDelay: () => void;
  closeNow: () => void;
  closeWithDelay: () => void;
  cancelTimers: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext(component: string): TooltipContextValue {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) {
    throw new Error(`<Tooltip.${component}> must be used inside <Tooltip>`);
  }
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Root: Tooltip                                                      */
/* ------------------------------------------------------------------ */

const TooltipRoot = React.forwardRef<HTMLSpanElement, TooltipProps>(
  (
    {
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      content,
      placement = 'top',
      offset = 8,
      delayDuration = 150,
      closeDelay = 80,
      disabled = false,
      showArrow = true,
      container,
      className,
      classNames,
      style,
      styles,
      children,
    },
    forwardedRef,
  ) => {
    const [open, setOpen] = useControllableState<boolean>({
      value: controlledOpen,
      defaultValue: defaultOpen,
      onChange: onOpenChange,
    });

    const triggerRef = React.useRef<HTMLSpanElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const openTimer = React.useRef<number | null>(null);
    const closeTimer = React.useRef<number | null>(null);

    const cancelTimers = React.useCallback(() => {
      if (openTimer.current !== null) {
        window.clearTimeout(openTimer.current);
        openTimer.current = null;
      }
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    }, []);

    React.useEffect(() => cancelTimers, [cancelTimers]);

    const openNow = React.useCallback(() => {
      if (disabled) return;
      cancelTimers();
      setOpen(true);
    }, [disabled, cancelTimers, setOpen]);

    const openWithDelay = React.useCallback(() => {
      if (disabled) return;
      cancelTimers();
      openTimer.current = window.setTimeout(
        () => {
          openTimer.current = null;
          setOpen(true);
        },
        Math.max(0, delayDuration),
      );
    }, [disabled, delayDuration, cancelTimers, setOpen]);

    const closeNow = React.useCallback(() => {
      cancelTimers();
      setOpen(false);
    }, [cancelTimers, setOpen]);

    const closeWithDelay = React.useCallback(() => {
      cancelTimers();
      closeTimer.current = window.setTimeout(
        () => {
          closeTimer.current = null;
          setOpen(false);
        },
        Math.max(0, closeDelay),
      );
    }, [closeDelay, cancelTimers, setOpen]);

    /* Escape closes while open */
    React.useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeNow();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [open, closeNow]);

    const contentId = React.useId();

    const portalContainer = React.useMemo<HTMLElement | null>(() => {
      if (container !== undefined) return container;
      if (typeof document === 'undefined') return null;
      return document.body;
    }, [container]);

    const ctx: TooltipContextValue = {
      open,
      disabled,
      placement,
      offset,
      showArrow,
      container: portalContainer,
      classNames,
      styles,
      triggerRef,
      contentRef,
      contentId,
      openNow,
      openWithDelay,
      closeNow,
      closeWithDelay,
      cancelTimers,
    };

    const setRootRef = React.useMemo(
      () => mergeRefs<HTMLSpanElement>(forwardedRef),
      [forwardedRef],
    );

    const useShorthand = content !== undefined;

    const body = useShorthand ? (
      <>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </>
    ) : (
      children
    );

    return (
      <TooltipContext.Provider value={ctx}>
        <span
          ref={setRootRef}
          className={cn('contents', classNames?.root, className)}
          style={{ ...styles?.root, ...style }}
          data-state={open ? 'open' : 'closed'}
          data-disabled={disabled || undefined}
          data-slot="tooltip-root"
        >
          {body}
        </span>
      </TooltipContext.Provider>
    );
  },
);
TooltipRoot.displayName = 'Tooltip';

/* ------------------------------------------------------------------ */
/*  Tooltip.Trigger                                                    */
/* ------------------------------------------------------------------ */

const TooltipTrigger = React.forwardRef<HTMLSpanElement, TooltipTriggerProps>(
  (
    { children, className, style, onPointerEnter, onPointerLeave, onFocus, onBlur, ...rest },
    forwardedRef,
  ) => {
    const {
      open,
      disabled,
      classNames,
      styles,
      triggerRef,
      contentId,
      openNow,
      openWithDelay,
      closeNow,
      closeWithDelay,
      cancelTimers,
    } = useTooltipContext('Trigger');

    const setRef = React.useMemo(
      () => mergeRefs<HTMLSpanElement>(forwardedRef, triggerRef),
      [forwardedRef, triggerRef],
    );

    const handlePointerEnter = composeHandlers<React.PointerEvent<HTMLSpanElement>>(
      onPointerEnter,
      () => openWithDelay(),
    );

    const handlePointerLeave = composeHandlers<React.PointerEvent<HTMLSpanElement>>(
      onPointerLeave,
      () => closeWithDelay(),
    );

    const handleFocus = composeHandlers<React.FocusEvent<HTMLSpanElement>>(onFocus, () =>
      openNow(),
    );

    const handleBlur = composeHandlers<React.FocusEvent<HTMLSpanElement>>(onBlur, () => closeNow());

    /* Cancel a pending close when the pointer lands on the trigger again */
    const handlePointerMove = () => cancelTimers();

    return (
      <span
        {...rest}
        ref={setRef}
        className={cn(DEFAULT_TRIGGER, classNames?.trigger, className)}
        style={{ ...styles?.trigger, ...style }}
        aria-describedby={open ? contentId : undefined}
        aria-disabled={disabled || undefined}
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled || undefined}
        data-slot="tooltip-trigger"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </span>
    );
  },
);
TooltipTrigger.displayName = 'Tooltip.Trigger';

/* ------------------------------------------------------------------ */
/*  Tooltip.Content                                                    */
/* ------------------------------------------------------------------ */

interface PositionState {
  top: number;
  left: number;
  side: TooltipPlacement;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ children, className, style, side: sideOverride, sideOffset, render }, forwardedRef) => {
    const {
      open,
      placement,
      offset,
      showArrow,
      container,
      classNames,
      styles,
      triggerRef,
      contentRef,
      contentId,
    } = useTooltipContext('Content');

    const resolvedPlacement = sideOverride ?? placement;
    const resolvedOffset = sideOffset ?? offset;

    const [coords, setCoords] = React.useState<PositionState | null>(null);

    const setRef = React.useMemo(
      () => mergeRefs<HTMLDivElement>(forwardedRef, contentRef),
      [forwardedRef, contentRef],
    );

    /* Position the content whenever it opens or the viewport changes. */
    React.useLayoutEffect(() => {
      if (!open) {
        setCoords(null);
        return;
      }
      const trigger = triggerRef.current;
      const contentEl = contentRef.current;
      if (!trigger || !contentEl) return;

      const update = () => {
        const t = trigger.getBoundingClientRect();
        const c = contentEl.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        /* Flip if the preferred side would overflow and the opposite has room. */
        let side = resolvedPlacement;
        const space: Record<TooltipPlacement, number> = {
          top: t.top - c.height - resolvedOffset,
          bottom: vh - t.bottom - c.height - resolvedOffset,
          left: t.left - c.width - resolvedOffset,
          right: vw - t.right - c.width - resolvedOffset,
        };
        if (space[side] < 0 && space[OPPOSITE[side]] >= 0) {
          side = OPPOSITE[side];
        }

        let top = 0;
        let left = 0;
        if (side === 'top') {
          top = t.top - c.height - resolvedOffset;
          left = t.left + t.width / 2 - c.width / 2;
        } else if (side === 'bottom') {
          top = t.bottom + resolvedOffset;
          left = t.left + t.width / 2 - c.width / 2;
        } else if (side === 'left') {
          top = t.top + t.height / 2 - c.height / 2;
          left = t.left - c.width - resolvedOffset;
        } else {
          top = t.top + t.height / 2 - c.height / 2;
          left = t.right + resolvedOffset;
        }

        /* Clamp inside the viewport with a small margin. */
        const margin = 4;
        left = Math.max(margin, Math.min(left, vw - c.width - margin));
        top = Math.max(margin, Math.min(top, vh - c.height - margin));

        setCoords({ top, left, side });
      };

      update();

      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
      };
    }, [open, resolvedPlacement, resolvedOffset, triggerRef, contentRef]);

    if (!open) return null;
    if (!container) return null;

    const side = coords?.side ?? resolvedPlacement;

    const arrowStyle: React.CSSProperties = (() => {
      switch (side) {
        case 'top':
          return { bottom: -3, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
        case 'bottom':
          return { top: -3, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
        case 'left':
          return { right: -3, top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
        case 'right':
          return { left: -3, top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
      }
    })();

    const contentStyle: React.CSSProperties = {
      position: 'fixed',
      top: coords?.top ?? 0,
      left: coords?.left ?? 0,
      opacity: coords ? 1 : 0,
      ...styles?.content,
      ...style,
    };

    const contentClassName = cn(DEFAULT_CONTENT, classNames?.content, className);

    const renderProps: TooltipContentRenderProps = {
      ref: setRef,
      className: contentClassName,
      style: contentStyle,
      placement: resolvedPlacement,
      side,
      open,
      contentId,
    };

    let node: React.ReactNode;
    if (render) {
      node = render(renderProps);
    } else {
      node = (
        <div
          ref={setRef}
          id={contentId}
          role="tooltip"
          data-side={side}
          data-state={open ? 'open' : 'closed'}
          data-slot="tooltip-content"
          className={contentClassName || undefined}
          style={contentStyle}
        >
          {children}
          {showArrow ? (
            <span
              aria-hidden="true"
              data-slot="tooltip-arrow"
              className={cn(DEFAULT_ARROW, classNames?.arrow)}
              style={{ ...arrowStyle, ...styles?.arrow }}
            />
          ) : null}
        </div>
      );
    }

    return createPortal(node, container);
  },
);
TooltipContent.displayName = 'Tooltip.Content';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

type TooltipComponent = React.ForwardRefExoticComponent<
  TooltipProps & React.RefAttributes<HTMLSpanElement>
> & {
  Trigger: typeof TooltipTrigger;
  Content: typeof TooltipContent;
};

const Tooltip = TooltipRoot as TooltipComponent;
Tooltip.Trigger = TooltipTrigger;
Tooltip.Content = TooltipContent;

export default Tooltip;
export { Tooltip };
