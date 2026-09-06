import { ReactNode } from 'react'
import { create } from 'zustand'

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning'
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/** Enter / exit motion preset. */
export type ToastAnimation = 'slide' | 'fade' | 'zoom' | 'bounce' | 'flip';

export type ToastEntry = {
  id: string;
  type: ToastType;
  title?: string;
  duration: number;
  position: ToastPosition;
  animation: ToastAnimation;
  closable: boolean;
  /** Show countdown progress bar when duration is finite. Default `true`. */
  progress: boolean;
  /** Pause auto-dismiss + progress on hover. Default `true`. */
  pauseOnHover: boolean;
  /** When true, no icon is rendered (`icon: false`). */
  hideIcon: boolean;
  /** When true, render custom icon from {@link getToastIcon}. */
  hasCustomIcon: boolean;
  className?: string;
  progressClassName?: string;
  /** Marks toast as animating out before removal. */
  exiting?: boolean;
};

export type ToastOptions = {
  id?: string
  type?: ToastType
  title?: string
  /** Auto-dismiss ms. `0` or `Infinity` = stay until dismissed. Default `4000`. */
  duration?: number
  position?: ToastPosition
  /** Enter / exit animation. Default `slide`. */
  animation?: ToastAnimation
  closable?: boolean
  /** Show countdown progress bar when duration is finite. Default `true`. */
  progress?: boolean
  /** Pause auto-dismiss + progress on hover. Default `true`. */
  pauseOnHover?: boolean
  /**
   * Toast icon. Omit for type default icon.
   * Pass a React node for a custom icon, or `false` to hide.
   */
  icon?: ReactNode | false
  className?: string
  progressClassName?: string
}

/**
 * App-wide defaults (e.g. via `<GlobalToast />` props or {@link setToastDefaults}).
 * Per-call `toast(..., options)` always wins over these.
 */
export type ToastDefaults = Omit<ToastOptions, 'id' | 'type' | 'title'>

const BASE_Z_INDEX = 100
const DEFAULT_DURATION = 4000

/** Exit animation duration per variant (must match CSS). */
export const TOAST_ANIMATION_MS: Record<ToastAnimation, number> = {
  fade: 200,
  slide: 250,
  zoom: 220,
  bounce: 450,
  flip: 300,
}

const EXIT_MS = TOAST_ANIMATION_MS.slide

const libraryDefaults = {
  type: 'default' as ToastType,
  duration: DEFAULT_DURATION,
  position: 'top-right' as ToastPosition,
  animation: 'slide' as ToastAnimation,
  closable: true,
  progress: true,
  pauseOnHover: true,
}

/** Mutable app defaults; set by GlobalToast / setToastDefaults. */
let toastDefaults: ToastDefaults = {}

/** Set app-wide toast defaults. Call-site options override these. */
export const setToastDefaults = (defaults: ToastDefaults) => {
  const next: ToastDefaults = {}
  ;(Object.keys(defaults) as (keyof ToastDefaults)[]).forEach((key) => {
    const value = defaults[key]
    if (value !== undefined) {
      ;(next as Record<string, unknown>)[key] = value
    }
  })
  toastDefaults = next
}

/** Current app-wide defaults (read-only snapshot). */
export const getToastDefaults = (): Readonly<ToastDefaults> => toastDefaults

const pick = <T>(
  option: T | undefined,
  configured: T | undefined,
  fallback: T,
): T => (option !== undefined ? option : configured !== undefined ? configured : fallback)

type ToastStoreState = {
  toasts: ToastEntry[]
  /** Bumps when content map changes so subscribers re-render. */
  contentKey: number
}

type DismissTimerState = {
  timer?: ReturnType<typeof setTimeout>
  remaining: number
  startedAt: number
}

/** Kept outside Zustand so Redux DevTools never serializes React nodes. */
const toastContentById = new Map<string, ReactNode>();
const toastIconById = new Map<string, ReactNode>();
const dismissTimers = new Map<string, DismissTimerState>();
const exitTimers = new Map<string, ReturnType<typeof setTimeout>>();

let toastIdCounter = 0;
const createToastId = () => {
  toastIdCounter += 1;
  return `toast-${toastIdCounter}`;
};

export const getToastContent = (id: string) => toastContentById.get(id) ?? null;

export const getToastIcon = (id: string) => toastIconById.get(id) ?? null;

export const useToastStore = create<ToastStoreState>()(() => ({
  toasts: [] as ToastEntry[],
  contentKey: 0,
}));

const clearExitTimer = (id: string) => {
  const exitTimer = exitTimers.get(id);
  if (exitTimer) {
    clearTimeout(exitTimer);
    exitTimers.delete(id);
  }
};

const clearDismissTimer = (id: string) => {
  const state = dismissTimers.get(id);
  if (state?.timer) clearTimeout(state.timer);
  dismissTimers.delete(id);
};

const clearTimers = (id: string) => {
  clearDismissTimer(id);
  clearExitTimer(id);
};

const removeToast = (id: string) => {
  clearTimers(id);
  toastContentById.delete(id);
  toastIconById.delete(id);
  useToastStore.setState((state) => ({
    toasts: state.toasts.filter((item) => item.id !== id),
    contentKey: state.contentKey + 1,
  }));
};

const scheduleAutoDismiss = (id: string, duration: number) => {
  if (!Number.isFinite(duration) || duration <= 0) return;
  clearDismissTimer(id);
  const startedAt = Date.now();
  const timer = setTimeout(() => {
    dismissTimers.delete(id);
    dismissToast(id);
  }, duration);
  dismissTimers.set(id, { timer, remaining: duration, startedAt });
};

/** Pause auto-dismiss countdown (keeps remaining ms). Used with progress bar hover. */
export const pauseToastTimer = (id: string) => {
  const state = dismissTimers.get(id);
  if (!state?.timer) return;
  clearTimeout(state.timer);
  const remaining = Math.max(0, state.remaining - (Date.now() - state.startedAt));
  dismissTimers.set(id, { remaining, startedAt: Date.now() });
};

/** Resume auto-dismiss after {@link pauseToastTimer}. */
export const resumeToastTimer = (id: string) => {
  const state = dismissTimers.get(id);
  if (!state || state.timer) return;
  if (state.remaining <= 0) {
    dismissTimers.delete(id);
    dismissToast(id);
    return;
  }
  const startedAt = Date.now();
  const timer = setTimeout(() => {
    dismissTimers.delete(id);
    dismissToast(id);
  }, state.remaining);
  dismissTimers.set(id, { timer, remaining: state.remaining, startedAt });
};

const pushToast = (content: ReactNode, options: ToastOptions = {}): string => {
  const id = options.id ?? createToastId()
  const existing = useToastStore.getState().toasts.find((t) => t.id === id)
  const defaults = toastDefaults

  const duration = pick(options.duration, defaults.duration, libraryDefaults.duration)
  const resolvedIcon =
    options.icon !== undefined ? options.icon : defaults.icon

  const hideIcon = resolvedIcon === false
  const hasCustomIcon = resolvedIcon != null && resolvedIcon !== false

  const entry: ToastEntry = {
    id,
    type: options.type ?? libraryDefaults.type,
    title: options.title,
    duration,
    position: pick(options.position, defaults.position, libraryDefaults.position),
    animation: pick(
      options.animation,
      defaults.animation,
      libraryDefaults.animation,
    ),
    closable: pick(options.closable, defaults.closable, libraryDefaults.closable),
    progress: pick(options.progress, defaults.progress, libraryDefaults.progress),
    pauseOnHover: pick(
      options.pauseOnHover,
      defaults.pauseOnHover,
      libraryDefaults.pauseOnHover,
    ),
    hideIcon,
    hasCustomIcon,
    className: options.className ?? defaults.className,
    progressClassName: options.progressClassName ?? defaults.progressClassName,
    exiting: false,
  }

  toastContentById.set(id, content)

  if (hasCustomIcon) {
    toastIconById.set(id, resolvedIcon as ReactNode)
  } else {
    toastIconById.delete(id)
  }

  if (existing) {
    clearTimers(id)
    useToastStore.setState((state) => ({
      toasts: state.toasts.map((item) => (item.id === id ? entry : item)),
      contentKey: state.contentKey + 1,
    }))
  } else {
    useToastStore.setState((state) => ({
      toasts: [...state.toasts, entry],
      contentKey: state.contentKey + 1,
    }))
  }

  scheduleAutoDismiss(id, entry.duration)
  return id
}

export const dismissToast = (id?: string) => {
  const { toasts } = useToastStore.getState();
  if (toasts.length === 0) return;

  if (!id) {
    toasts.forEach((item) => dismissToast(item.id));
    return;
  }

  const target = toasts.find((item) => item.id === id);
  if (!target || target.exiting) return;

  clearTimers(id);

  const exitMs = TOAST_ANIMATION_MS[target.animation] ?? EXIT_MS;

  useToastStore.setState((state) => ({
    toasts: state.toasts.map((item) => (item.id === id ? { ...item, exiting: true } : item)),
  }));

  const exitTimer = setTimeout(() => {
    exitTimers.delete(id);
    removeToast(id);
  }, exitMs);
  exitTimers.set(id, exitTimer);
};

type ToastFn = {
  (content: ReactNode, options?: ToastOptions): string;
  success: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
  error: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
  info: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
  warning: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) => string;
  dismiss: typeof dismissToast;
};

export const toast: ToastFn = Object.assign(
  (content: ReactNode, options?: ToastOptions) => pushToast(content, options),
  {
    success: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) =>
      pushToast(content, { ...options, type: 'success' }),
    error: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) =>
      pushToast(content, { ...options, type: 'error' }),
    info: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) =>
      pushToast(content, { ...options, type: 'info' }),
    warning: (content: ReactNode, options?: Omit<ToastOptions, 'type'>) =>
      pushToast(content, { ...options, type: 'warning' }),
    dismiss: dismissToast,
  },
);

export const TOAST_BASE_Z_INDEX = BASE_Z_INDEX;
/** @deprecated Prefer {@link TOAST_ANIMATION_MS} for the active variant. */
export const TOAST_EXIT_MS = EXIT_MS;
