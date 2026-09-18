export type HtmlAst = {
  tag: string;
  attrs: Record<string, string>;
  children: Array<HtmlAst | string>;
};

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'audio',
  'b',
  'blockquote',
  'br',
  'caption',
  'circle',
  'clippath',
  'code',
  'col',
  'colgroup',
  'defs',
  'del',
  'desc',
  'div',
  'em',
  'ellipse',
  'figcaption',
  'figure',
  'g',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'image',
  'img',
  'kbd',
  'li',
  'line',
  'lineargradient',
  'mark',
  'marker',
  'mask',
  'ol',
  'p',
  'path',
  'pattern',
  'picture',
  'polygon',
  'polyline',
  'pre',
  'radialgradient',
  'rect',
  's',
  'source',
  'span',
  'stop',
  'strong',
  'sub',
  'sup',
  'svg',
  'switch',
  'symbol',
  'table',
  'tbody',
  'td',
  'text',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'tspan',
  'u',
  'ul',
  'use',
  'video',
]);

export function isAllowedTag(tag: string): boolean {
  return ALLOWED_TAGS.has(tag.toLowerCase());
}

export function isVoidTag(tag: string): boolean {
  return VOID_TAGS.has(tag.toLowerCase());
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, '\u00A0')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/gi, '&');
}

export function isSafeUrl(url: string, kind: 'href' | 'src'): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/html')) {
    return false;
  }
  if (kind === 'href') {
    return /^(https?:|mailto:|tel:)/i.test(trimmed);
  }
  if (/^https?:/i.test(trimmed) || /^blob:/i.test(trimmed)) return true;
  return /^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp|x-icon|avif)/i.test(trimmed);
}

function skipWs(src: string, i: number): number {
  while (i < src.length && /\s/.test(src.charAt(i))) i += 1;
  return i;
}

function parseAttrs(src: string, start: number): { attrs: Record<string, string>; i: number; selfClosing: boolean } {
  const attrs: Record<string, string> = {};
  let i = start;
  let selfClosing = false;

  while (i < src.length) {
    i = skipWs(src, i);
    const ch = src.charAt(i);
    if (ch === '>' || ch === '') break;
    if (ch === '/') {
      selfClosing = true;
      i += 1;
      i = skipWs(src, i);
      break;
    }

    const nameStart = i;
    while (i < src.length && /[:\w-.]/.test(src.charAt(i))) i += 1;
    const name = src.slice(nameStart, i);
    if (!name) {
      i += 1;
      continue;
    }

    i = skipWs(src, i);
    let value = '';
    if (src.charAt(i) === '=') {
      i += 1;
      i = skipWs(src, i);
      const quote = src.charAt(i);
      if (quote === '"' || quote === "'") {
        i += 1;
        const valueStart = i;
        while (i < src.length && src.charAt(i) !== quote) i += 1;
        value = src.slice(valueStart, i);
        if (src.charAt(i) === quote) i += 1;
      } else {
        const valueStart = i;
        while (i < src.length && /[^\s>]/.test(src.charAt(i))) i += 1;
        value = src.slice(valueStart, i);
      }
    }

    const lower = name.toLowerCase();
    if (lower.startsWith('on') || lower === 'style' || lower === 'srcdoc' || lower === 'formaction') {
      continue;
    }
    attrs[lower] = decodeEntities(value);
  }

  if (src.charAt(i) === '>') i += 1;
  return { attrs, i, selfClosing };
}

function sanitizeAttrs(tag: string, attrs: Record<string, string>): Record<string, string> {
  const clean: Record<string, string> = {};
  const lowerTag = tag.toLowerCase();

  for (const [rawName, rawValue] of Object.entries(attrs)) {
    const name = rawName.toLowerCase();
    if (name === 'href' || name === 'xlink:href') {
      if (lowerTag === 'use' && rawValue.trim().startsWith('#')) {
        clean[name] = rawValue.trim();
      } else if (isSafeUrl(rawValue, 'href')) {
        clean[name] = rawValue;
      }
      continue;
    }
    if (name === 'src' || name === 'poster') {
      if (isSafeUrl(rawValue, 'src')) clean[name] = rawValue;
      continue;
    }
    if (name === 'align') {
      if (/^(left|center|right|justify)$/i.test(rawValue.trim())) {
        clean[name] = rawValue.trim().toLowerCase();
      }
      continue;
    }
    clean[name] = rawValue;
  }

  if (lowerTag === 'a' && clean['href'] && /^https?:/i.test(clean['href'])) {
    if (!clean['rel']) clean['rel'] = 'noopener noreferrer';
  }

  return clean;
}

type ParseResult = { nodes: Array<HtmlAst | string>; i: number };

function parseNodes(src: string, start: number, stopTag: string | null): ParseResult {
  const nodes: Array<HtmlAst | string> = [];
  let i = start;

  while (i < src.length) {
    if (src.charAt(i) === '<') {
      if (src.startsWith('<!--', i)) {
        const end = src.indexOf('-->', i + 4);
        i = end === -1 ? src.length : end + 3;
        continue;
      }

      if (src.startsWith('<![CDATA[', i)) {
        const end = src.indexOf(']]>', i + 9);
        const text = src.slice(i + 9, end === -1 ? src.length : end);
        if (text) nodes.push(text);
        i = end === -1 ? src.length : end + 3;
        continue;
      }

      if (src.startsWith('</', i)) {
        const close = src.indexOf('>', i);
        const tag = src.slice(i + 2, close === -1 ? src.length : close).trim().toLowerCase();
        if (stopTag && tag === stopTag) {
          return { nodes, i: close === -1 ? src.length : close + 1 };
        }
        i = close === -1 ? src.length : close + 1;
        continue;
      }

      const tagMatch = src.slice(i).match(/^<([a-zA-Z][\w:-]*)/);
      if (!tagMatch || tagMatch[1] === undefined) {
        nodes.push('<');
        i += 1;
        continue;
      }

      const tag = tagMatch[1];
      const afterName = i + 1 + tag.length;
      const { attrs, i: afterAttrs, selfClosing } = parseAttrs(src, afterName);
      const lower = tag.toLowerCase();

      if (!isAllowedTag(lower)) {
        if (isVoidTag(lower) || selfClosing) {
          i = afterAttrs;
          continue;
        }
        const skipped = parseNodes(src, afterAttrs, lower);
        i = skipped.i;
        continue;
      }

      if (isVoidTag(lower) || selfClosing) {
        nodes.push({ tag: lower, attrs: sanitizeAttrs(lower, attrs), children: [] });
        i = afterAttrs;
        continue;
      }

      const inner = parseNodes(src, afterAttrs, lower);
      nodes.push({
        tag: lower,
        attrs: sanitizeAttrs(lower, attrs),
        children: inner.nodes,
      });
      i = inner.i;
      continue;
    }

    const next = src.indexOf('<', i);
    const textEnd = next === -1 ? src.length : next;
    const text = decodeEntities(src.slice(i, textEnd));
    if (text) nodes.push(text);
    i = textEnd;
    if (next === -1) break;
  }

  return { nodes, i };
}

export function looksLikeHtmlBlock(source: string): boolean {
  const trimmed = source.trimStart();
  if (!trimmed.startsWith('<')) return false;
  if (trimmed.startsWith('<!--')) return true;
  const match = trimmed.match(/^<\/?([a-zA-Z][\w:-]*)/);
  const tag = match?.[1]?.toLowerCase();
  return Boolean(tag && (isAllowedTag(tag) || isVoidTag(tag)));
}

function parseOneNode(src: string, start: number): { ast: HtmlAst | string; i: number } | null {
  if (src.charAt(start) !== '<') return null;

  if (src.startsWith('<!--', start)) {
    const end = src.indexOf('-->', start + 4);
    return { ast: '', i: end === -1 ? src.length : end + 3 };
  }

  if (src.startsWith('</', start)) return null;

  const tagMatch = src.slice(start).match(/^<([a-zA-Z][\w:-]*)/);
  if (!tagMatch || tagMatch[1] === undefined) return null;

  const tag = tagMatch[1];
  const afterName = start + 1 + tag.length;
  const { attrs, i: afterAttrs, selfClosing } = parseAttrs(src, afterName);
  const lower = tag.toLowerCase();

  if (!isAllowedTag(lower)) {
    if (isVoidTag(lower) || selfClosing) {
      return { ast: '', i: afterAttrs };
    }
    const skipped = parseNodes(src, afterAttrs, lower);
    return { ast: '', i: skipped.i };
  }

  if (isVoidTag(lower) || selfClosing) {
    return { ast: { tag: lower, attrs: sanitizeAttrs(lower, attrs), children: [] }, i: afterAttrs };
  }

  const inner = parseNodes(src, afterAttrs, lower);
  return {
    ast: { tag: lower, attrs: sanitizeAttrs(lower, attrs), children: inner.nodes },
    i: inner.i,
  };
}

export function parseHtmlFromStart(source: string): { ast: HtmlAst | string; consumed: number } | null {
  const start = skipWs(source, 0);
  if (source.charAt(start) !== '<') return null;
  const parsed = parseOneNode(source, start);
  if (!parsed) return null;
  return { ast: parsed.ast, consumed: parsed.i };
}

export function parseHtmlFragment(source: string): Array<HtmlAst | string> {
  return parseNodes(source, 0, null).nodes;
}
