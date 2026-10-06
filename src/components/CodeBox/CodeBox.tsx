import * as React from 'react';
import { cn } from '../../utils';
import { highlightCode } from '../Md/highlightCode';
import CodeBoxCopyButton, { type CodeBoxCopyLabels } from './CodeBoxCopyButton';

export type { CodeBoxCopyLabels };

export interface CodeBoxClassNames {
  root?: string;
  header?: string;
  filename?: string;
  language?: string;
  pre?: string;
  code?: string;
  copyButton?: string;
}

export interface CodeBoxStyles {
  root?: React.CSSProperties;
  header?: React.CSSProperties;
  filename?: React.CSSProperties;
  language?: React.CSSProperties;
  pre?: React.CSSProperties;
  code?: React.CSSProperties;
  copyButton?: React.CSSProperties;
}

export interface CodeBoxProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The code to display. Rendered as text, so markup is never interpreted. */
  code: string;
  /** Language hint for the colorizer (`ts`, `tsx`, `js`, `py`, `bash`, `css`, `json`). */
  language?: string;
  /** Optional header label, typically a file name. */
  filename?: string;
  /** Show the language in the header. Default `false`. */
  showLanguage?: boolean;
  /** Render the copy button. Default `true`. */
  copyable?: boolean;
  /** Allow long lines to wrap instead of scrolling horizontally. Default `false`. */
  wrap?: boolean;
  /** Set `false` to render plain, uncolored code. Default `true`. */
  highlight?: boolean;
  /** Override the copy button's text, e.g. for localization. */
  labels?: CodeBoxCopyLabels;
  classNames?: CodeBoxClassNames;
  styles?: CodeBoxStyles;
}

const DEFAULT_ROOT =
  'relative overflow-hidden rounded-lg border border-gray-800 bg-gray-900 text-gray-100';
const DEFAULT_HEADER =
  'flex items-center gap-2 border-b border-gray-800 bg-gray-950/60 px-3 py-1.5';
const DEFAULT_FILENAME = 'truncate font-mono text-xs text-gray-300';
const DEFAULT_LANGUAGE =
  'shrink-0 font-mono text-[11px] uppercase tracking-wide text-gray-500';
const DEFAULT_PRE = 'overflow-x-auto p-4 font-mono text-sm leading-relaxed';
const DEFAULT_FLOATING_COPY = 'absolute right-2 top-2 z-10 bg-gray-900/80 backdrop-blur-sm';

/**
 * Read-only code block with lightweight syntax coloring and a copy button.
 *
 * Deliberately hook-free so it stays a Server Component: the coloring runs on
 * the server and only the copy button ships to the client. Do not add
 * "use client" here.
 */
const CodeBox = React.forwardRef<HTMLDivElement, CodeBoxProps>(function CodeBox(
  {
    code,
    language,
    filename,
    showLanguage = false,
    copyable = true,
    wrap = false,
    highlight = true,
    labels,
    className,
    classNames,
    style,
    styles,
    ...props
  },
  ref,
) {
  const hasHeader = Boolean(filename) || showLanguage;

  const copyButton = copyable ? (
    <CodeBoxCopyButton
      code={code}
      labels={labels}
      className={cn(!hasHeader && DEFAULT_FLOATING_COPY, classNames?.copyButton)}
      style={styles?.copyButton}
    />
  ) : null;

  return (
    <div
      ref={ref}
      className={cn(DEFAULT_ROOT, classNames?.root, className)}
      style={{ ...styles?.root, ...style }}
      {...props}
    >
      {hasHeader && (
        <div className={cn(DEFAULT_HEADER, classNames?.header)} style={styles?.header}>
          {filename && (
            <span className={cn(DEFAULT_FILENAME, classNames?.filename)} style={styles?.filename}>
              {filename}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2">
            {showLanguage && language && (
              <span
                className={cn(DEFAULT_LANGUAGE, classNames?.language)}
                style={styles?.language}
              >
                {language}
              </span>
            )}
            {copyButton}
          </span>
        </div>
      )}

      <pre
        className={cn(DEFAULT_PRE, wrap && 'whitespace-pre-wrap break-words', classNames?.pre)}
        style={styles?.pre}
      >
        <code
          className={cn(language && `language-${language}`, classNames?.code)}
          style={styles?.code}
        >
          {highlight ? highlightCode(code, language) : code}
        </code>
      </pre>

      {!hasHeader && copyButton}
    </div>
  );
});

CodeBox.displayName = 'CodeBox';

export default CodeBox;
