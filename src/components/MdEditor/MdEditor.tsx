'use client';

import * as React from 'react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '../../utils';
import { Md } from '../Md/Md';

export type MdEditorMode = 'edit' | 'preview' | 'split';

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
  onImageUpload?: (file: File) => Promise<string> | string;
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

const TOOLS: Tool[] = [
  { label: 'B', title: 'Bold', run: (ctx) => applyWrap(ctx, '**') },
  { label: 'I', title: 'Italic', run: (ctx) => applyWrap(ctx, '*') },
  { label: 'S', title: 'Strikethrough', run: (ctx) => applyWrap(ctx, '~~') },
  { label: 'H', title: 'Heading', run: (ctx) => applyLinePrefix(ctx, '## ') },
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
    label: '🔗',
    title: 'Link',
    run: (ctx) => applyWrap(ctx, '[', '](https://)', 'link text'),
  },
  {
    label: '🖼',
    title: 'Image',
    run: (ctx) => applyWrap(ctx, '![', '](https://)', 'alt text'),
  },
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

function readFileUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function IconButton({
  label,
  title,
  onClick,
  disabled,
}: {
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
}

export function MdEditor({
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
  onImageUpload,
}: MdEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [innerMode, setInnerMode] = useState<MdEditorMode>(defaultMode);
  const [dragging, setDragging] = useState(false);

  const isControlled = value !== undefined;
  const markdown = isControlled ? value : inner;
  const currentMode = mode ?? innerMode;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  const setMarkdown = useCallback(
    (next: string) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const setCurrentMode = (next: MdEditorMode) => {
    if (mode === undefined) setInnerMode(next);
    onModeChange?.(next);
  };

  const runTool = (tool: Tool) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    tool.run({ textarea, value: markdown, setValue: setMarkdown });
  };

  const insertImageUrl = useCallback(
    (url: string, alt = 'image') => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const isSvgMarkup = url.trim().startsWith('<svg');
      insertBlock(
        { textarea, value: markdown, setValue: setMarkdown },
        isSvgMarkup ? `${url}\n` : `![${alt}](${url})\n`,
      );
    },
    [markdown, setMarkdown],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((file) => file.type.startsWith('image/') || file.name.endsWith('.svg'));
      for (const file of list) {
        const url = onImageUpload ? await onImageUpload(file) : await readFileUrl(file);
        const alt = file.name.replace(/\.[^.]+$/, '');
        if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
          if (url.trim().startsWith('<svg')) insertImageUrl(url, alt);
          else insertImageUrl(url, alt);
        } else {
          insertImageUrl(url, alt);
        }
      }
    },
    [insertImageUrl, onImageUpload],
  );

  const showEditor = currentMode === 'edit' || currentMode === 'split';
  const showPreview = currentMode === 'preview' || currentMode === 'split';

  return (
    <div className={cn('a2z-md-editor overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
        {TOOLS.map((tool) => (
          <IconButton
            key={tool.title}
            label={tool.label}
            title={tool.title}
            disabled={disabled || readOnly || !showEditor}
            onClick={() => runTool(tool)}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {(['edit', 'split', 'preview'] as MdEditorMode[]).map((item) => (
          <IconButton
            key={item}
            label={item}
            title={item}
            onClick={() => setCurrentMode(item)}
          />
        ))}
      </div>

      <div
        className={cn('grid min-h-0', currentMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}
        style={{ height: heightStyle }}
      >
        {showEditor && (
          <textarea
            ref={textareaRef}
            value={markdown}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            onChange={(event) => setMarkdown(event.target.value)}
            onKeyDown={(event) => {
              if (!(event.ctrlKey || event.metaKey) || !textareaRef.current) return;
              const editorCtx = { textarea: textareaRef.current, value: markdown, setValue: setMarkdown };
              if (event.key === 'b') {
                event.preventDefault();
                applyWrap(editorCtx, '**');
              } else if (event.key === 'i') {
                event.preventDefault();
                applyWrap(editorCtx, '*');
              } else if (event.key === 'k') {
                event.preventDefault();
                applyWrap(editorCtx, '[', '](https://)', 'link text');
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
              currentMode === 'split' && 'border-b border-gray-200 md:border-b-0 md:border-r',
              dragging && 'bg-blue-50',
              textareaClassName,
            )}
          />
        )}

        {showPreview && (
          <div className={cn('h-full overflow-auto p-3', previewClassName)}>
            {markdown.trim() ? (
              <Md value={markdown} breaks={breaks} />
            ) : (
              <p className="text-sm text-gray-400">Preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MdEditor;
