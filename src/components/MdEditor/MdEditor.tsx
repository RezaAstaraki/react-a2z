'use client';

import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils';
import { isSafeUrl } from '../Md/htmlAst';
import Button from '../Button/Button';
import { CustomModal } from '../Modal/CustomModal';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [innerMode, setInnerMode] = useState<MdEditorMode>(defaultMode);
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

  const isControlled = value !== undefined;
  const markdown = isControlled ? value : inner;
  const currentMode = mode ?? innerMode;
  const heightStyle = typeof height === 'number' ? `${height}px` : height;
  const toolsDisabled = disabled || readOnly;

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
        const url = onImageUpload ? await onImageUpload(file) : await readFileUrl(file);
        const alt = altOverride || file.name.replace(/\.[^.]+$/, '') || 'image';
        insertImageUrl(url, alt);
      }
    },
    [insertImageUrl, onImageUpload],
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

  const showEditor = currentMode === 'edit' || currentMode === 'split';
  const showPreview = currentMode === 'preview' || currentMode === 'split';

  return (
    <div className={cn('a2z-md-editor overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
        {HEADING_LEVELS.map((level) => (
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
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {STYLE_TOOLS.map((tool) => (
          <IconButton
            key={tool.title}
            label={tool.label}
            title={tool.title}
            disabled={toolsDisabled}
            onClick={() => runTool(tool)}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {ALIGN_TOOLS.map((tool) => (
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
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {BLOCK_TOOLS.map((tool) => (
          <IconButton
            key={tool.title}
            label={tool.label}
            title={tool.title}
            disabled={toolsDisabled}
            onClick={() => runTool(tool)}
          />
        ))}
        <IconButton
          label="🔗"
          title="Insert link"
          disabled={toolsDisabled}
          onClick={openLinkDialog}
        />
        <IconButton
          label="🖼"
          title="Upload image"
          disabled={toolsDisabled}
          onClick={() => setImageDialogOpen(true)}
        />
        <span className="mx-1 h-4 w-px bg-gray-200" />
        {(['edit', 'split', 'preview'] as MdEditorMode[]).map((item) => (
          <IconButton
            key={item}
            label={item}
            title={item}
            active={currentMode === item}
            onClick={() => setCurrentMode(item)}
          />
        ))}
      </div>

      <div
        className={cn('grid min-h-0', currentMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}
        style={{ height: heightStyle }}
      >
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
            } else if (event.key === 'u') {
              event.preventDefault();
              applyWrap(editorCtx, '<u>', '</u>');
            } else if (event.key === 'k') {
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
          <div className={cn('h-full overflow-auto p-3', previewClassName)}>
            {markdown.trim() ? (
              <Md value={markdown} breaks={breaks} />
            ) : (
              <p className="text-sm text-gray-400">Preview</p>
            )}
          </div>
        )}
      </div>

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

          {imageFile && (
            <p className="truncate text-xs text-gray-500">{imageFile.name}</p>
          )}

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
}

export default MdEditor;
