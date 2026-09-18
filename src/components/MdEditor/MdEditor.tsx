'use client';

import * as React from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn, readFileAsDataUrl } from '../../utils';
import { isSafeUrl } from '../Md/htmlAst';
import Button from '../Button/Button';
import { CustomModal } from '../Modal/CustomModal';
import { Md } from '../Md/Md';
import {
  continueListOnEnter,
  countWords,
  indentSelection,
  outdentSelection,
  toggleNthTask,
} from './editorHelpers';

export type MdEditorMode = 'edit' | 'preview' | 'split';

export type MdEditorToolId =
  | 'undo'
  | 'redo'
  | 'headings'
  | 'style'
  | 'align'
  | 'blocks'
  | 'task'
  | 'link'
  | 'image'
  | 'fullscreen'
  | 'modes';

export type MdEditorHandle = {
  focus: () => void;
  blur: () => void;
  getMarkdown: () => string;
  setMarkdown: (value: string) => void;
  insertMarkdown: (snippet: string) => void;
  undo: () => void;
  redo: () => void;
};

export type MdEditorProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  previewClassName?: string;
  height?: number | string;
  mode?: MdEditorMode;
  defaultMode?: MdEditorMode;
  onModeChange?: (mode: MdEditorMode) => void;
  disabled?: boolean;
  readOnly?: boolean;
  breaks?: boolean;
  /** Keep editor/preview scroll positions in sync (split mode). Default `true`. */
  scrollSync?: boolean;
  /** Show fullscreen toggle. Default `true`. */
  fullscreen?: boolean;
  /** Controlled fullscreen state. */
  isFullscreen?: boolean;
  defaultFullscreen?: boolean;
  onFullscreenChange?: (fullscreen: boolean) => void;
  /** Indent string for Tab. Default two spaces. */
  indent?: string;
  /** Show word/char status bar. Default `true`. */
  showStatus?: boolean;
  /** Hide built-in toolbar groups/buttons. */
  hideTools?: MdEditorToolId[];
  /** Extra nodes rendered at the end of the toolbar (before mode toggles). */
  extraTools?: React.ReactNode;
  /**
   * Resolve an image file to a URL inserted into markdown.
   * Omit to use the built-in {@link readFileAsDataUrl} (local data URL).
   */
  onImageUpload?: (file: File) => Promise<string> | string;
  /** Fires after an image URL is resolved and inserted. */
  onImageInserted?: (info: { file: File; url: string; alt: string }) => void;
};

type Tool = {
  label: string;
  title: string;
  run: (ctx: EditorCtx) => void;
};

type EditorCtx = {
  textarea: HTMLTextAreaElement;
  value: string;
  setValue: (next: string) => void;
};

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;

function applyWrap(ctx: EditorCtx, before: string, after = before, placeholder = 'text') {
  const { textarea, value, setValue } = ctx;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const from = start + before.length;
    textarea.setSelectionRange(from, from + selected.length);
  });
}

function applyLinePrefix(ctx: EditorCtx, prefix: string) {
  const { textarea, value, setValue } = ctx;
  const start = textarea.selectionStart;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + prefix.length;
    textarea.setSelectionRange(pos, pos);
  });
}

function applyHeading(ctx: EditorCtx, level: (typeof HEADING_LEVELS)[number]) {
  const { textarea, value, setValue } = ctx;
  const start = textarea.selectionStart;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', start);
  const end = lineEnd === -1 ? value.length : lineEnd;
  const line = value.slice(lineStart, end);
  const text = line.replace(/^#{1,6}\s*/, '');
  const nextLine = `${'#'.repeat(level)} ${text}`;
  setValue(value.slice(0, lineStart) + nextLine + value.slice(end));
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = lineStart + nextLine.length;
    textarea.setSelectionRange(pos, pos);
  });
}

function insertBlock(ctx: EditorCtx, block: string) {
  const { textarea, value, setValue } = ctx;
  const start = textarea.selectionStart;
  const padBefore = start > 0 && value.charAt(start - 1) !== '\n' ? '\n\n' : start > 0 ? '\n' : '';
  const next = value.slice(0, start) + padBefore + block + value.slice(textarea.selectionEnd);
  setValue(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + padBefore.length + block.length;
    textarea.setSelectionRange(pos, pos);
  });
}

function applyAlign(ctx: EditorCtx, align: 'left' | 'center' | 'right' | 'justify') {
  const { textarea, value, setValue } = ctx;
  let start = textarea.selectionStart;
  let end = textarea.selectionEnd;
  if (start === end) {
    start = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    end = lineEnd === -1 ? value.length : lineEnd;
  }
  const selected = value.slice(start, end);
  const inner = selected
    .replace(/^\s*<p\s+align="(?:left|center|right|justify)">\s*/i, '')
    .replace(/\s*<\/p>\s*$/i, '');
  const block = `<p align="${align}">${inner || 'text'}</p>`;
  setValue(value.slice(0, start) + block + value.slice(end));
  requestAnimationFrame(() => {
    textarea.focus();
    const from = start + `<p align="${align}">`.length;
    textarea.setSelectionRange(from, from + (inner || 'text').length);
  });
}

const STYLE_TOOLS: Tool[] = [
  { label: 'B', title: 'Bold', run: (ctx) => applyWrap(ctx, '**') },
  { label: 'I', title: 'Italic', run: (ctx) => applyWrap(ctx, '*') },
  { label: 'U', title: 'Underline', run: (ctx) => applyWrap(ctx, '<u>', '</u>') },
  { label: 'S', title: 'Strikethrough', run: (ctx) => applyWrap(ctx, '~~') },
];

const BLOCK_TOOLS: Tool[] = [
  { label: '</>', title: 'Code', run: (ctx) => applyWrap(ctx, '`') },
  {
    label: '{ }',
    title: 'Code block',
    run: (ctx) => applyWrap(ctx, '```\n', '\n```', 'code'),
  },
  { label: '"', title: 'Quote', run: (ctx) => applyLinePrefix(ctx, '> ') },
  { label: '•', title: 'Bullet list', run: (ctx) => applyLinePrefix(ctx, '- ') },
  { label: '1.', title: 'Numbered list', run: (ctx) => applyLinePrefix(ctx, '1. ') },
  {
    label: 'SVG',
    title: 'Inline SVG',
    run: (ctx) =>
      insertBlock(
        ctx,
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">\n  <circle cx="12" cy="12" r="10" />\n</svg>\n',
      ),
  },
  {
    label: 'Tbl',
    title: 'Table',
    run: (ctx) => insertBlock(ctx, '| Column | Column |\n| --- | --- |\n| Cell | Cell |\n'),
  },
  { label: '—', title: 'Divider', run: (ctx) => insertBlock(ctx, '---\n') },
];

const ALIGN_TOOLS: Array<{ label: string; title: string; align: 'left' | 'center' | 'right' | 'justify' }> = [
  { label: 'L', title: 'Align left', align: 'left' },
  { label: 'C', title: 'Align center', align: 'center' },
  { label: 'R', title: 'Align right', align: 'right' },
  { label: 'J', title: 'Justify', align: 'justify' },
];

const MAX_HISTORY = 100;
const HISTORY_DEBOUNCE_MS = 400;

function IconButton({
  label,
  title,
  onClick,
  disabled,
  active,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50',
        active && 'bg-gray-200 text-gray-900',
      )}
    >
      {label}
    </button>
  );
}

function Separator() {
  return <span className="mx-1 h-4 w-px bg-gray-200" />;
}

export const MdEditor = forwardRef<MdEditorHandle, MdEditorProps>(function MdEditor(
  {
    value,
    defaultValue = '',
    onChange,
    placeholder = 'Write markdown…',
    className,
    textareaClassName,
    previewClassName,
    height = 360,
    mode,
    defaultMode = 'split',
    onModeChange,
    disabled = false,
    readOnly = false,
    breaks = true,
    scrollSync = true,
    fullscreen: fullscreenEnabled = true,
    isFullscreen,
    defaultFullscreen = false,
    onFullscreenChange,
    indent = '  ',
    showStatus = true,
    hideTools = [],
    extraTools,
    onImageUpload,
    onImageInserted,
  },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncingScrollRef = useRef(false);
  const [inner, setInner] = useState(defaultValue);
  const [innerMode, setInnerMode] = useState<MdEditorMode>(defaultMode);
  const [innerFullscreen, setInnerFullscreen] = useState(defaultFullscreen);
  const [dragging, setDragging] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageError, setImageError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkHref, setLinkHref] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkRangeRef = useRef({ start: 0, end: 0 });
  const historyPastRef = useRef<string[]>([]);
  const historyFutureRef = useRef<string[]>([]);
  const applyingHistoryRef = useRef(false);
  const typingOriginRef = useRef<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef('');
  const [historyTick, setHistoryTick] = useState(0);

  const isControlled = value !== undefined;
  const markdown = isControlled ? value : inner;
  valueRef.current = markdown;
  const currentMode = mode ?? innerMode;
  const fullscreen = isFullscreen ?? innerFullscreen;
  const heightStyle = fullscreen ? '100%' : typeof height === 'number' ? `${height}px` : height;
  const toolsDisabled = disabled || readOnly;
  const hidden = new Set(hideTools);
  const canUndo =
    historyTick >= 0 &&
    (typingOriginRef.current !== null || historyPastRef.current.length > 0);
  const canRedo = historyTick >= 0 && historyFutureRef.current.length > 0;

  const applyValue = useCallback(
    (next: string) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const pushHistory = useCallback((snapshot: string) => {
    if (applyingHistoryRef.current) return;
    const past = historyPastRef.current;
    if (past[past.length - 1] === snapshot) return;
    historyPastRef.current = [...past.slice(-(MAX_HISTORY - 1)), snapshot];
    historyFutureRef.current = [];
    setHistoryTick((tick) => tick + 1);
  }, []);

  const flushTypingHistory = useCallback(() => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    const origin = typingOriginRef.current;
    if (origin === null) return;
    typingOriginRef.current = null;
    if (origin !== valueRef.current) pushHistory(origin);
  }, [pushHistory]);

  const setMarkdown = useCallback(
    (next: string) => {
      flushTypingHistory();
      pushHistory(valueRef.current);
      applyValue(next);
    },
    [applyValue, flushTypingHistory, pushHistory],
  );

  const setMarkdownFromInput = useCallback(
    (next: string) => {
      if (typingOriginRef.current === null) {
        typingOriginRef.current = valueRef.current;
        setHistoryTick((tick) => tick + 1);
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        typingTimerRef.current = null;
        const origin = typingOriginRef.current;
        typingOriginRef.current = null;
        if (origin !== null && origin !== valueRef.current) pushHistory(origin);
        setHistoryTick((tick) => tick + 1);
      }, HISTORY_DEBOUNCE_MS);
      applyValue(next);
    },
    [applyValue, pushHistory],
  );

  const undo = useCallback(() => {
    if (disabled || readOnly) return;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    if (typingOriginRef.current !== null) {
      const restore = typingOriginRef.current;
      typingOriginRef.current = null;
      applyingHistoryRef.current = true;
      applyValue(restore);
      applyingHistoryRef.current = false;
      setHistoryTick((tick) => tick + 1);
      requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }
    const past = historyPastRef.current;
    if (!past.length) return;
    const prev = past[past.length - 1]!;
    historyPastRef.current = past.slice(0, -1);
    historyFutureRef.current = [...historyFutureRef.current, valueRef.current];
    applyingHistoryRef.current = true;
    applyValue(prev);
    applyingHistoryRef.current = false;
    setHistoryTick((tick) => tick + 1);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [applyValue, disabled, readOnly]);

  const redo = useCallback(() => {
    if (disabled || readOnly) return;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    typingOriginRef.current = null;
    const future = historyFutureRef.current;
    if (!future.length) return;
    const next = future[future.length - 1]!;
    historyFutureRef.current = future.slice(0, -1);
    historyPastRef.current = [...historyPastRef.current, valueRef.current];
    applyingHistoryRef.current = true;
    applyValue(next);
    applyingHistoryRef.current = false;
    setHistoryTick((tick) => tick + 1);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [applyValue, disabled, readOnly]);

  const setFullscreen = useCallback(
    (next: boolean) => {
      if (isFullscreen === undefined) setInnerFullscreen(next);
      onFullscreenChange?.(next);
    },
    [isFullscreen, onFullscreenChange],
  );

  const insertMarkdownAtCursor = useCallback(
    (snippet: string) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        setMarkdown(valueRef.current + snippet);
        return;
      }
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const next = valueRef.current.slice(0, start) + snippet + valueRef.current.slice(end);
      setMarkdown(next);
      requestAnimationFrame(() => {
        textarea.focus();
        const pos = start + snippet.length;
        textarea.setSelectionRange(pos, pos);
      });
    },
    [setMarkdown],
  );

  useImperativeHandle(
    ref,
    () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      getMarkdown: () => valueRef.current,
      setMarkdown: (next) => setMarkdown(next),
      insertMarkdown: (snippet) => insertMarkdownAtCursor(snippet),
      undo,
      redo,
    }),
    [insertMarkdownAtCursor, redo, setMarkdown, undo],
  );

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen, setFullscreen]);

  const setCurrentMode = (next: MdEditorMode) => {
    if (mode === undefined) setInnerMode(next);
    onModeChange?.(next);
  };

  const getCtx = (): EditorCtx | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;
    return { textarea, value: markdown, setValue: setMarkdown };
  };

  const runTool = (tool: Tool) => {
    const ctx = getCtx();
    if (!ctx) return;
    tool.run(ctx);
  };

  const syncScroll = (source: 'editor' | 'preview') => {
    if (!scrollSync || currentMode !== 'split' || syncingScrollRef.current) return;
    const editor = textareaRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;
    syncingScrollRef.current = true;
    const from = source === 'editor' ? editor : preview;
    const to = source === 'editor' ? preview : editor;
    const range = from.scrollHeight - from.clientHeight;
    const ratio = range > 0 ? from.scrollTop / range : 0;
    to.scrollTop = ratio * (to.scrollHeight - to.clientHeight);
    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  };

  const insertImageUrl = useCallback(
    (url: string, alt = 'image') => {
      const ctx = textareaRef.current
        ? { textarea: textareaRef.current, value: markdown, setValue: setMarkdown }
        : null;
      if (!ctx) return;
      const isSvgMarkup = url.trim().startsWith('<svg');
      insertBlock(ctx, isSvgMarkup ? `${url}\n` : `![${alt}](${url})\n`);
    },
    [markdown, setMarkdown],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[], altOverride?: string) => {
      const list = Array.from(files).filter((file) => file.type.startsWith('image/') || file.name.endsWith('.svg'));
      for (const file of list) {
        const url = onImageUpload ? await onImageUpload(file) : await readFileAsDataUrl(file);
        const alt = altOverride || file.name.replace(/\.[^.]+$/, '') || 'image';
        insertImageUrl(url, alt);
        onImageInserted?.({ file, url, alt });
      }
    },
    [insertImageUrl, onImageInserted, onImageUpload],
  );

  const resetImageDialog = () => {
    setImageDialogOpen(false);
    setImageFile(null);
    setImageAlt('');
    setImagePreview('');
    setImageError('');
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeImageDialog = () => {
    if (uploading) return;
    resetImageDialog();
  };

  const chooseImageFile = (file: File | undefined) => {
    if (!file) return;
    const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg');
    if (!isImage) {
      setImageError('Please choose an image or SVG file.');
      return;
    }
    setImageError('');
    setImageFile(file);
    setImageAlt((current) => current || file.name.replace(/\.[^.]+$/, ''));
  };

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const insertChosenImage = async () => {
    if (!imageFile) {
      setImageError('Choose a file to upload.');
      return;
    }
    setUploading(true);
    setImageError('');
    try {
      await handleFiles([imageFile], imageAlt.trim() || undefined);
      resetImageDialog();
    } catch {
      setUploading(false);
      setImageError('Could not upload the image. Try again.');
    }
  };

  const openLinkDialog = () => {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? markdown.length;
    const end = textarea?.selectionEnd ?? markdown.length;
    linkRangeRef.current = { start, end };
    const selected = markdown.slice(start, end);
    const existing = selected.match(/^\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (existing && existing[1] !== undefined && existing[2] !== undefined) {
      setLinkText(existing[1]);
      setLinkHref(existing[2]);
    } else if (/^(https?:|mailto:|tel:|\/|#)/i.test(selected.trim())) {
      setLinkText(selected.trim());
      setLinkHref(selected.trim());
    } else {
      setLinkText(selected);
      setLinkHref(/^https?:\/\//i.test(selected) ? selected : 'https://');
    }
    setLinkError('');
    setLinkDialogOpen(true);
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkError('');
  };

  const insertChosenLink = () => {
    const text = linkText.trim() || linkHref.trim();
    const href = linkHref.trim();
    if (!href) {
      setLinkError('Enter a URL.');
      return;
    }
    if (!isSafeUrl(href, 'href')) {
      setLinkError('Enter a valid http, https, mailto, tel, or relative URL.');
      return;
    }
    const { start, end } = linkRangeRef.current;
    const snippet = `[${text}](${href})`;
    setMarkdown(markdown.slice(0, start) + snippet + markdown.slice(end));
    closeLinkDialog();
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const pos = start + snippet.length;
      textarea.setSelectionRange(pos, pos);
    });
  };

  const applySelectionTransform = (
    transform: (value: string, start: number, end: number) => {
      value: string;
      selectionStart: number;
      selectionEnd: number;
    },
  ) => {
    const textarea = textareaRef.current;
    if (!textarea || toolsDisabled) return;
    const result = transform(markdown, textarea.selectionStart, textarea.selectionEnd);
    setMarkdown(result.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const showEditor = currentMode === 'edit' || currentMode === 'split';
  const showPreview = currentMode === 'preview' || currentMode === 'split';
  const words = countWords(markdown);
  const chars = markdown.length;

  return (
    <div
      className={cn(
        'a2z-md-editor overflow-hidden rounded-lg border border-gray-200 bg-white',
        fullscreen && 'fixed inset-0 z-[1000] flex flex-col rounded-none border-0',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
        {!hidden.has('undo') && (
          <IconButton label="Undo" title="Undo (Ctrl+Z)" disabled={toolsDisabled || !canUndo} onClick={undo} />
        )}
        {!hidden.has('redo') && (
          <IconButton label="Redo" title="Redo (Ctrl+Y)" disabled={toolsDisabled || !canRedo} onClick={redo} />
        )}
        {(!hidden.has('undo') || !hidden.has('redo')) && <Separator />}

        {!hidden.has('headings') &&
          HEADING_LEVELS.map((level) => (
            <IconButton
              key={`h${level}`}
              label={`H${level}`}
              title={`Heading ${level}`}
              disabled={toolsDisabled}
              onClick={() => {
                const ctx = getCtx();
                if (ctx) applyHeading(ctx, level);
              }}
            />
          ))}
        {!hidden.has('headings') && <Separator />}

        {!hidden.has('style') &&
          STYLE_TOOLS.map((tool) => (
            <IconButton
              key={tool.title}
              label={tool.label}
              title={tool.title}
              disabled={toolsDisabled}
              onClick={() => runTool(tool)}
            />
          ))}
        {!hidden.has('style') && <Separator />}

        {!hidden.has('align') &&
          ALIGN_TOOLS.map((tool) => (
            <IconButton
              key={tool.align}
              label={tool.label}
              title={tool.title}
              disabled={toolsDisabled}
              onClick={() => {
                const ctx = getCtx();
                if (ctx) applyAlign(ctx, tool.align);
              }}
            />
          ))}
        {!hidden.has('align') && <Separator />}

        {!hidden.has('blocks') &&
          BLOCK_TOOLS.map((tool) => (
            <IconButton
              key={tool.title}
              label={tool.label}
              title={tool.title}
              disabled={toolsDisabled}
              onClick={() => runTool(tool)}
            />
          ))}

        {!hidden.has('task') && (
          <IconButton
            label="Task"
            title="Task list item"
            disabled={toolsDisabled}
            onClick={() => {
              const ctx = getCtx();
              if (ctx) applyLinePrefix(ctx, '- [ ] ');
            }}
          />
        )}

        {!hidden.has('link') && (
          <IconButton label="Link" title="Insert link (Ctrl+K)" disabled={toolsDisabled} onClick={openLinkDialog} />
        )}
        {!hidden.has('image') && (
          <IconButton
            label="Img"
            title="Upload image"
            disabled={toolsDisabled}
            onClick={() => setImageDialogOpen(true)}
          />
        )}

        {extraTools}

        <Separator />

        {!hidden.has('modes') &&
          (['edit', 'split', 'preview'] as MdEditorMode[]).map((item) => (
            <IconButton
              key={item}
              label={item}
              title={item}
              active={currentMode === item}
              onClick={() => setCurrentMode(item)}
            />
          ))}

        {fullscreenEnabled && !hidden.has('fullscreen') && (
          <IconButton
            label={fullscreen ? 'Exit' : 'Full'}
            title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
            active={fullscreen}
            onClick={() => setFullscreen(!fullscreen)}
          />
        )}
      </div>

      <div
        className={cn(
          'grid min-h-0',
          fullscreen && 'flex-1',
          currentMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1',
        )}
        style={{ height: heightStyle }}
      >
        <textarea
          ref={textareaRef}
          value={markdown}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(event) => setMarkdownFromInput(event.target.value)}
          onScroll={() => syncScroll('editor')}
          onKeyDown={(event) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (event.key === 'Tab') {
              event.preventDefault();
              applySelectionTransform((value, start, end) =>
                event.shiftKey ? outdentSelection(value, start, end, indent) : indentSelection(value, start, end, indent),
              );
              return;
            }

            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
              const continued = continueListOnEnter(markdown, textarea.selectionStart);
              if (continued) {
                event.preventDefault();
                setMarkdown(continued.value);
                requestAnimationFrame(() => {
                  textarea.focus();
                  textarea.setSelectionRange(continued.selection, continued.selection);
                });
                return;
              }
            }

            if (!(event.ctrlKey || event.metaKey)) return;
            const key = event.key.toLowerCase();
            if (key === 'z' && !event.shiftKey) {
              event.preventDefault();
              undo();
              return;
            }
            if (key === 'y' || (key === 'z' && event.shiftKey)) {
              event.preventDefault();
              redo();
              return;
            }
            const editorCtx = { textarea, value: markdown, setValue: setMarkdown };
            if (key === 'b') {
              event.preventDefault();
              applyWrap(editorCtx, '**');
            } else if (key === 'i') {
              event.preventDefault();
              applyWrap(editorCtx, '*');
            } else if (key === 'u') {
              event.preventDefault();
              applyWrap(editorCtx, '<u>', '</u>');
            } else if (key === 'k') {
              event.preventDefault();
              openLinkDialog();
            }
          }}
          onPaste={(event) => {
            const files = event.clipboardData?.files;
            if (files && files.length) {
              event.preventDefault();
              void handleFiles(files);
            }
          }}
          onDragOver={(event) => {
            if (Array.from(event.dataTransfer.types).includes('Files')) {
              event.preventDefault();
              setDragging(true);
            }
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            if (!event.dataTransfer.files.length) return;
            event.preventDefault();
            setDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            'h-full w-full resize-none border-0 bg-transparent p-3 font-mono text-sm leading-6 text-gray-900 outline-none',
            !showEditor && 'hidden',
            currentMode === 'split' && 'border-b border-gray-200 md:border-b-0 md:border-r',
            dragging && 'bg-blue-50',
            textareaClassName,
          )}
        />

        {showPreview && (
          <div
            ref={previewRef}
            onScroll={() => syncScroll('preview')}
            className={cn('h-full overflow-auto p-3', previewClassName)}
          >
            {markdown.trim() ? (
              <Md
                value={markdown}
                breaks={breaks}
                onTaskToggle={
                  toolsDisabled
                    ? undefined
                    : (index, checked) => setMarkdown(toggleNthTask(markdown, index, checked))
                }
              />
            ) : (
              <p className="text-sm text-gray-400">Preview</p>
            )}
          </div>
        )}
      </div>

      {showStatus && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500">
          <span>
            {words} word{words === 1 ? '' : 's'} · {chars} char{chars === 1 ? '' : 's'}
          </span>
          <span>Tab indent · Enter continues lists · Esc exits fullscreen</span>
        </div>
      )}

      <CustomModal
        isOpen={imageDialogOpen}
        onClose={closeImageDialog}
        title="Upload image"
        size="sm"
        isDismissible={!uploading}
      >
        <div className="flex flex-col gap-4">
          <label
            className={cn(
              'flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50',
              uploading && 'pointer-events-none opacity-60',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              disabled={uploading}
              onChange={(event) => chooseImageFile(event.target.files?.[0])}
            />
            {imagePreview ? (
              <img src={imagePreview} alt={imageAlt || 'Selected image'} className="max-h-40 max-w-full rounded-md" />
            ) : (
              <>
                <span className="text-sm font-medium text-gray-700">Choose an image file</span>
                <span className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WebP, or SVG</span>
              </>
            )}
          </label>

          {imageFile && <p className="truncate text-xs text-gray-500">{imageFile.name}</p>}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Alt text</span>
            <input
              type="text"
              value={imageAlt}
              disabled={uploading}
              onChange={(event) => setImageAlt(event.target.value)}
              placeholder="Describe the image"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {imageError && <p className="text-sm text-red-600">{imageError}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="filled-gray"
              size="sm"
              text="Cancel"
              disabled={uploading}
              onClick={closeImageDialog}
            />
            <Button
              type="button"
              variant="filled-blue"
              size="sm"
              text="Insert"
              loading={uploading}
              disabled={!imageFile}
              onClick={() => void insertChosenImage()}
            />
          </div>
        </div>
      </CustomModal>

      <CustomModal isOpen={linkDialogOpen} onClose={closeLinkDialog} title="Insert link" size="sm">
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Text</span>
            <input
              type="text"
              value={linkText}
              onChange={(event) => setLinkText(event.target.value)}
              placeholder="Link text"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">URL</span>
            <input
              type="text"
              value={linkHref}
              onChange={(event) => setLinkHref(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </label>
          {linkError && <p className="text-sm text-red-600">{linkError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="filled-gray" size="sm" text="Cancel" onClick={closeLinkDialog} />
            <Button type="button" variant="filled-blue" size="sm" text="Insert" onClick={insertChosenLink} />
          </div>
        </div>
      </CustomModal>
    </div>
  );
});

MdEditor.displayName = 'MdEditor';

export default MdEditor;
