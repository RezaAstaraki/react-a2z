'use client';

import * as React from 'react';
import { cn } from '../../utils';
import { copyToClipboard } from '../../utils/copyToClipboard';

export interface CodeBoxCopyLabels {
  copy?: string;
  copied?: string;
  error?: string;
}

export interface CodeBoxCopyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Text written to the clipboard. */
  code: string;
  labels?: CodeBoxCopyLabels;
  /** How long the copied/failed feedback stays visible, in ms. Default 1500. */
  resetDelay?: number;
}

type CopyStatus = 'idle' | 'copied' | 'error';

const DEFAULT_CLASSES =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-gray-400 ' +
  'transition-colors hover:bg-gray-800 hover:text-gray-100 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'data-[status=copied]:text-emerald-400 data-[status=error]:text-red-400';

const CopyIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
  >
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const CheckIcon = () => (
  <svg
    aria-hidden
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="size-3.5"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * Internal to CodeBox — the only client-side piece of the component. Kept
 * separate so the code block itself can stay a Server Component.
 */
export const CodeBoxCopyButton = React.forwardRef<HTMLButtonElement, CodeBoxCopyButtonProps>(
  function CodeBoxCopyButton(
    { code, labels, resetDelay = 1500, className, onClick, type = 'button', ...props },
    ref,
  ) {
    const [status, setStatus] = React.useState<CopyStatus>('idle');
    const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear the pending reset so it cannot fire after unmount.
    React.useEffect(
      () => () => {
        if (timer.current) clearTimeout(timer.current);
      },
      [],
    );

    const handleClick = React.useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (timer.current) clearTimeout(timer.current);
        try {
          await copyToClipboard(code);
          setStatus('copied');
        } catch {
          setStatus('error');
        }
        timer.current = setTimeout(() => setStatus('idle'), resetDelay);
      },
      [code, onClick, resetDelay],
    );

    const label =
      status === 'copied'
        ? (labels?.copied ?? 'Copied!')
        : status === 'error'
          ? (labels?.error ?? 'Copy failed')
          : (labels?.copy ?? 'Copy');

    return (
      <button
        ref={ref}
        type={type}
        onClick={handleClick}
        data-status={status}
        className={cn(DEFAULT_CLASSES, className)}
        {...props}
      >
        {status === 'copied' ? <CheckIcon /> : <CopyIcon />}
        <span aria-live="polite">{label}</span>
      </button>
    );
  },
);

CodeBoxCopyButton.displayName = 'CodeBoxCopyButton';

export default CodeBoxCopyButton;
