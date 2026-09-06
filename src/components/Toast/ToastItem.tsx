'use client'

import * as React from 'react'
import { cn } from '../../utils'
import {
  dismissToast,
  getToastContent,
  getToastIcon,
  pauseToastTimer,
  resumeToastTimer,
  TOAST_ANIMATION_MS,
  type ToastAnimation,
  type ToastEntry,
  type ToastPosition,
  type ToastType,
} from './toastStore'

const iconSvgProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconSvgProps} width={16} height={16}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const SuccessIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconSvgProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const ErrorIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconSvgProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
)

const InfoIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconSvgProps}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
)

const WarningIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconSvgProps}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

const DefaultIcon = ({ className }: { className?: string }) => (
  <svg className={className} {...iconSvgProps}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
)

const DEFAULT_ICONS: Record<ToastType, React.FC<{ className?: string }>> = {
  default: DefaultIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
  warning: WarningIcon,
}

const TYPE_CLASS: Record<ToastType, string> = {
  default: 'border-gray-200 bg-white text-gray-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
}

const TYPE_ICON: Record<ToastType, string> = {
  default: 'text-gray-500',
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-blue-600',
  warning: 'text-amber-600',
}

const TYPE_PROGRESS: Record<ToastType, string> = {
  default: 'bg-gray-400',
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
}

const ROLE: Record<ToastType, 'status' | 'alert'> = {
  default: 'status',
  success: 'status',
  error: 'alert',
  info: 'status',
  warning: 'alert',
}

type SlideDir = 'top' | 'bottom' | 'left' | 'right'

const slideDirFromPosition = (position: ToastPosition): SlideDir => {
  if (position.endsWith('left')) return 'left'
  if (position.endsWith('right')) return 'right'
  if (position.startsWith('bottom')) return 'bottom'
  return 'top'
}

const resolveMotionName = (
  animation: ToastAnimation,
  position: ToastPosition,
  exiting: boolean,
): string => {
  const phase = exiting ? 'out' : 'in'

  if (animation === 'slide') {
    return `a2z-toast-slide-${phase}-${slideDirFromPosition(position)}`
  }

  return `a2z-toast-${animation}-${phase}`
}

export type ToastItemProps = {
  toast: ToastEntry
  position: ToastPosition
}

function ToastIconSlot({ entry }: { entry: ToastEntry }) {
  if (entry.hideIcon) return null

  if (entry.hasCustomIcon) {
    return (
      <span className="mt-0.5 shrink-0 [&_svg]:h-5 [&_svg]:w-5" aria-hidden>
        {getToastIcon(entry.id)}
      </span>
    )
  }

  const Icon = DEFAULT_ICONS[entry.type]
  return (
    <span className={cn('mt-0.5 shrink-0', TYPE_ICON[entry.type])} aria-hidden>
      <Icon />
    </span>
  )
}

export function ToastItem({ toast: entry, position }: ToastItemProps) {
  const content = getToastContent(entry.id)
  const [paused, setPaused] = React.useState(false)

  const showProgress =
    entry.progress &&
    !entry.exiting &&
    Number.isFinite(entry.duration) &&
    entry.duration > 0

  const durationMs = TOAST_ANIMATION_MS[entry.animation]
  const motionName = resolveMotionName(
    entry.animation,
    position,
    Boolean(entry.exiting),
  )

  const handleMouseEnter = () => {
    if (!entry.pauseOnHover || entry.exiting) return
    setPaused(true)
    pauseToastTimer(entry.id)
  }

  const handleMouseLeave = () => {
    if (!entry.pauseOnHover || entry.exiting) return
    setPaused(false)
    resumeToastTimer(entry.id)
  }

  return (
    <div
      role={ROLE[entry.type]}
      aria-live={entry.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-md border px-4 py-3 pb-3.5 shadow-lg will-change-transform',
        TYPE_CLASS[entry.type],
        entry.className,
      )}
      style={{
        animation: `${motionName} ${durationMs}ms ease-out forwards`,
      }}
    >
      <ToastIconSlot entry={entry} />
      <div className="min-w-0 flex-1">
        {entry.title ? (
          <p className="mb-0.5 text-sm font-semibold leading-5">{entry.title}</p>
        ) : null}
        <div className="text-sm leading-5">{content}</div>
      </div>
      {entry.closable ? (
        <button
          type="button"
          onClick={() => dismissToast(entry.id)}
          className="shrink-0 rounded p-0.5 text-current opacity-60 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          aria-label="Dismiss"
        >
          <CloseIcon />
        </button>
      ) : null}

      {showProgress ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden"
          aria-hidden
        >
          <div
            className={cn(
              'h-full w-full origin-left',
              TYPE_PROGRESS[entry.type],
              entry.progressClassName,
            )}
            style={{
              animation: `a2z-toast-progress ${entry.duration}ms linear forwards`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
