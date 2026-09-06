'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../utils'
import { ToastItem } from './ToastItem'
import {
  setToastDefaults,
  TOAST_BASE_Z_INDEX,
  useToastStore,
  type ToastDefaults,
  type ToastPosition,
} from './toastStore'

const POSITION_CLASS: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
}

const POSITIONS: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

const TOAST_KEYFRAMES = `
@keyframes a2z-toast-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@keyframes a2z-toast-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes a2z-toast-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes a2z-toast-zoom-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes a2z-toast-zoom-out {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.85); }
}

@keyframes a2z-toast-bounce-in {
  0% { opacity: 0; transform: scale(0.4); }
  50% { opacity: 1; transform: scale(1.06); }
  70% { transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes a2z-toast-bounce-out {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.5); }
}

@keyframes a2z-toast-flip-in {
  from { opacity: 0; transform: perspective(480px) rotateX(72deg); }
  to { opacity: 1; transform: perspective(480px) rotateX(0deg); }
}
@keyframes a2z-toast-flip-out {
  from { opacity: 1; transform: perspective(480px) rotateX(0deg); }
  to { opacity: 0; transform: perspective(480px) rotateX(72deg); }
}

@keyframes a2z-toast-slide-in-top {
  from { opacity: 0; transform: translateY(-14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes a2z-toast-slide-out-top {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-14px); }
}
@keyframes a2z-toast-slide-in-bottom {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes a2z-toast-slide-out-bottom {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(14px); }
}
@keyframes a2z-toast-slide-in-left {
  from { opacity: 0; transform: translateX(-16px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes a2z-toast-slide-out-left {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(-16px); }
}
@keyframes a2z-toast-slide-in-right {
  from { opacity: 0; transform: translateX(16px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes a2z-toast-slide-out-right {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(16px); }
}
`

export type GlobalToastProps = ToastDefaults

export default function GlobalToast({
  position,
  duration,
  animation,
  closable,
  progress,
  pauseOnHover,
  icon,
  className,
  progressClassName,
}: GlobalToastProps) {
  const toasts = useToastStore((state) => state.toasts)
  const contentKey = useToastStore((state) => state.contentKey)
  void contentKey

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    setToastDefaults({
      position,
      duration,
      animation,
      closable,
      progress,
      pauseOnHover,
      icon,
      className,
      progressClassName,
    })

    return () => {
      setToastDefaults({})
    }
  }, [
    position,
    duration,
    animation,
    closable,
    progress,
    pauseOnHover,
    icon,
    className,
    progressClassName,
  ])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <>
      <style>{TOAST_KEYFRAMES}</style>
      {POSITIONS.map((pos) => {
        const group = toasts.filter((t) => t.position === pos)
        if (group.length === 0) return null

        const fromTop = pos.startsWith('top')

        return (
          <div
            key={pos}
            className={cn(
              'pointer-events-none fixed flex gap-2',
              fromTop ? 'flex-col' : 'flex-col-reverse',
              POSITION_CLASS[pos],
            )}
            style={{ zIndex: TOAST_BASE_Z_INDEX }}
            aria-label="Notifications"
          >
            {group.map((entry) => (
              <ToastItem key={entry.id} toast={entry} position={pos} />
            ))}
          </div>
        )
      })}
    </>,
    document.body,
  )
}
