'use client';

import * as React from 'react';
import {
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';
import {
  ModalBackdrop,
  ModalPlacement,
  ModalScrollBehavior,
  ModalSize,
  ModalVariant,
} from './modalStore';

const openPanels: Array<{
  panel: HTMLDivElement;
  settings: React.MutableRefObject<{
    isTop: boolean;
    zIndex: number;
    isDismissible: boolean;
    onClose: () => void;
  }>;
}> = [];
let previousBodyOverflow = '';
let stackReturnFocus: HTMLElement | null = null;
const focusableSelector =
  'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';
function focusableElements(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled, [hidden], [aria-hidden="true"]') &&
      element.getClientRects().length > 0
  );
}
function topPanel() {
  let top: (typeof openPanels)[number] | undefined;
  for (const entry of openPanels) {
    if (
      entry.settings.current.isTop &&
      (!top || entry.settings.current.zIndex >= top.settings.current.zIndex)
    )
      top = entry;
  }
  return top;
}

export type CustomModalProps = {
  /** Whether the modal is open. Renders nothing when false. */
  isOpen: boolean;
  /** Called when the user closes it -- Escape, backdrop, or close button. */
  onClose: () => void;
  /** Modal body content. */
  children: ReactNode;
  /** Heading text, wired to aria-labelledby. */
  title?: string;
  /** Accessible name for dialogs with no visible title. */
  'aria-label'?: string;
  /** Id of descriptive content inside the dialog. */
  'aria-describedby'?: string;
  /** Replaces the default title heading; receives a titleId prop. */
  header?: ReactNode;
  /** Panel max-width. Default `md`. */
  size?: ModalSize;
  /** Where the panel sits in the viewport. Default `center`. */
  placement?: ModalPlacement;
  /** Backdrop treatment behind the panel. Default `blur`. */
  backdrop?: ModalBackdrop;
  /** Extra Tailwind classes merged onto the backdrop layer. */
  backdropClassName?: string;
  /**
   * `default` — bordered card chrome, padding, close button.
   * `unstyled` — blank shell (portal / backdrop / escape); style everything yourself.
   */
  variant?: ModalVariant;
  /** `inside` scrolls the body, `outside` the page, `hidden` neither. Default `inside`. */
  scrollBehavior?: ModalScrollBehavior;
  /** Whether Escape and backdrop clicks close it. Default `true`. */
  isDismissible?: boolean;
  /** Show the close button. Defaults to false for variant `unstyled`. */
  showCloseButton?: boolean;
  /** Enables drag-by-header. Same switch as isDraggable. Default `false`. */
  headerDraggable?: boolean;
  /** Enables drag-by-header. Same switch as headerDraggable. Default `false`. */
  isDraggable?: boolean;
  /** Overlay stacking order. Default `50`. */
  zIndex?: number;
  /** Classes on the panel, merged before contentClassName. */
  className?: string;
  /** Classes on the body wrapper -- the element that scrolls. */
  bodyClassName?: string;
  /** Classes on the panel, merged after className. NOT the body -- use bodyClassName. */
  contentClassName?: string;
  /** No effect in CustomModal: stacking is decided by the store. Passed through by GlobalModal. */
  stackable?: boolean;
  /** Only the topmost stacked modal should handle Escape. */
  isTop?: boolean;
};

const SIZE_CLASS: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[min(100%,96rem)]',
};

const PLACEMENT_CLASS: Record<ModalPlacement, string> = {
  auto: 'items-center justify-center',
  center: 'items-center justify-center',
  top: 'items-start justify-center',
  'top-center': 'items-start justify-center',
  bottom: 'items-end justify-center',
  'bottom-center': 'items-end justify-center',
  'top-start': 'items-start justify-start',
  'top-end': 'items-start justify-end',
  'center-start': 'items-center justify-start',
  'center-end': 'items-center justify-end',
  'bottom-start': 'items-end justify-start',
  'bottom-end': 'items-end justify-end',
};

const BACKDROP_CLASS: Record<ModalBackdrop, string> = {
  opaque: 'bg-overlay/50',
  blur: 'bg-overlay/40 backdrop-blur-sm',
  transparent: 'bg-transparent',
};

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export function CustomModal({
  isOpen,
  onClose,
  children,
  title,
  header,
  size = 'md',
  placement = 'center',
  backdrop = 'blur',
  backdropClassName,
  variant = 'default',
  scrollBehavior = 'inside',
  isDismissible = true,
  showCloseButton,
  headerDraggable = false,
  isDraggable = false,
  zIndex = 50,
  className,
  bodyClassName,
  contentClassName,
  isTop = true,
  'aria-label': ariaLabel,
  'aria-describedby': describedBy,
}: CustomModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const settings = useRef({ isTop, zIndex, isDismissible, onClose });
  settings.current = { isTop, zIndex, isDismissible, onClose };
  const dragStart = useRef<{
    x: number;
    y: number;
    ox: number;
    oy: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isUnstyled = variant === 'unstyled';
  const canDrag = Boolean(headerDraggable || isDraggable);
  const hasHeader = Boolean(header || title);
  const closeButtonVisible = showCloseButton ?? !isUnstyled;
  const showHeaderClose = closeButtonVisible && hasHeader;
  const showFloatingClose = closeButtonVisible && !hasHeader;
  const bodyScrollClass =
    scrollBehavior === 'inside'
      ? 'overflow-y-auto'
      : scrollBehavior === 'outside'
        ? 'overflow-visible'
        : 'overflow-hidden';

  const closeThisModal = () => {
    setDragOffset({ x: 0, y: 0 });
    onClose();
  };

  const requestClose = () => {
    if (isDismissible) closeThisModal();
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const entry = { panel, settings };
    if (openPanels.length === 0) {
      stackReturnFocus = previousFocus;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openPanels.push(entry);
    const focusFirst = () => (focusableElements(panel)[0] ?? panel).focus();
    if (topPanel() === entry) {
      const autofocus = panel.querySelector<HTMLElement>('[autofocus]');
      (autofocus ?? focusableElements(panel)[0] ?? panel).focus();
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (topPanel() !== entry || event.defaultPrevented) return;
      if (event.key === 'Escape' && settings.current.isDismissible) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setDragOffset({ x: 0, y: 0 });
        settings.current.onClose();
      } else if (event.key === 'Tab') {
        const elements = focusableElements(panel);
        const first = elements[0];
        const last = elements[elements.length - 1];
        const focused = document.activeElement;
        if (
          !first ||
          (event.shiftKey
            ? focused === first || focused === panel || !panel.contains(focused)
            : focused === last || !panel.contains(focused))
        ) {
          event.preventDefault();
          (event.shiftKey ? (last ?? panel) : (first ?? panel)).focus();
        }
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (topPanel() === entry && !panel.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      const wasTop = topPanel() === entry;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      openPanels.splice(openPanels.indexOf(entry), 1);
      if (openPanels.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
        if (stackReturnFocus?.isConnected) stackReturnFocus.focus();
        stackReturnFocus = null;
      } else if (wasTop) {
        const next = topPanel()?.panel;
        const restore =
          previousFocus?.isConnected && (!next || next.contains(previousFocus))
            ? previousFocus
            : next;
        restore?.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !canDrag) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!dragStart.current) return;
      setDragOffset({
        x: dragStart.current.ox + (event.clientX - dragStart.current.x),
        y: dragStart.current.oy + (event.clientY - dragStart.current.y),
      });
    };

    const onPointerUp = () => {
      dragStart.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isOpen, canDrag]);

  const onHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag || event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [role='button']")) {
      return;
    }
    event.preventDefault();
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      ox: dragOffset.x,
      oy: dragOffset.y,
    };
  };

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <div
      data-a2z-modal=""
      className={cn(
        'fixed inset-0 flex overflow-hidden',
        !isUnstyled &&
          'p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        PLACEMENT_CLASS[placement ?? 'center']
      )}
      style={{ zIndex }}
    >
      {isDismissible ? (
        <button
          type="button"
          aria-label="Close"
          tabIndex={-1}
          className={cn('absolute inset-0', BACKDROP_CLASS[backdrop], backdropClassName)}
          onClick={requestClose}
        />
      ) : (
        <div
          aria-hidden
          className={cn('absolute inset-0', BACKDROP_CLASS[backdrop], backdropClassName)}
        />
      )}

      <div
        ref={panelRef}
        data-a2z-modal-panel=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasHeader ? (header ? `${titleId}-header` : titleId) : undefined}
        aria-label={ariaLabel ?? (!hasHeader ? 'Dialog' : undefined)}
        aria-describedby={describedBy}
        tabIndex={-1}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        }}
        className={cn(
          'relative z-[1] flex max-h-[min(calc(100dvh-2rem),920px)] w-full flex-col outline-none',
          isUnstyled
            ? 'overflow-visible'
            : 'overflow-hidden rounded-xl border border-border bg-surface-raised shadow-lg',
          SIZE_CLASS[size],
          className,
          contentClassName
        )}
      >
        {showFloatingClose ? (
          <button
            type="button"
            aria-label="Close"
            onClick={closeThisModal}
            className="absolute end-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-neutral-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <CloseIcon />
          </button>
        ) : null}

        {hasHeader ? (
          <div
            className={cn(
              'relative shrink-0 select-none',
              !isUnstyled && 'border-b border-border px-6 py-5',
              canDrag && 'cursor-grab touch-none active:cursor-grabbing'
            )}
            onPointerDown={onHeaderPointerDown}
          >
            {header ? (
              <div id={`${titleId}-header`}>
                {React.isValidElement(header)
                  ? React.cloneElement(header as React.ReactElement<{ titleId?: string }>, {
                      titleId,
                    })
                  : header}
              </div>
            ) : (
              <h2 id={titleId} className="pe-10 text-lg font-semibold tracking-tight text-fg">
                {title}
              </h2>
            )}

            {showHeaderClose ? (
              <button
                type="button"
                aria-label="Close"
                onClick={closeThisModal}
                className="absolute end-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-neutral-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
        ) : null}

        <div className={cn('min-h-0', !isUnstyled && 'p-6', bodyScrollClass, bodyClassName)}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
