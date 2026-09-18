import { HtmlAst, isSafeUrl, looksLikeHtmlBlock, parseHtmlFromStart } from './htmlAst';

export type MdInline =
  | { type: 'text'; value: string }
  | { type: 'strong'; children: MdInline[] }
  | { type: 'em'; children: MdInline[] }
  | { type: 'del'; children: MdInline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; title?: string; children: MdInline[] }
  | { type: 'image'; src: string; alt: string; title?: string }
  | { type: 'break' }
  | { type: 'html'; ast: HtmlAst | string };

export type MdListItem = {
  checked: boolean | null;
  children: MdBlock[];
};

export type MdBlock =
  | { type: 'paragraph'; children: MdInline[] }
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; children: MdInline[] }
  | { type: 'code'; lang?: string; value: string }
  | { type: 'blockquote'; children: MdBlock[] }
  | { type: 'list'; ordered: boolean; start?: number; items: MdListItem[] }
  | {
      type: 'table';
      align: Array<'left' | 'center' | 'right' | null>;
      header: MdInline[][];
      rows: MdInline[][][];
    }
  | { type: 'hr' }
  | { type: 'html'; ast: HtmlAst | string };

export type ParseMarkdownOptions = {
  breaks?: boolean;
};

function isWordChar(ch: string | undefined): boolean {
  return Boolean(ch && /[\w]/.test(ch));
}

function pushText(out: MdInline[], value: string) {
  if (!value) return;
  const last = out[out.length - 1];
  if (last?.type === 'text') {
    last.value += value;
    return;
  }
  out.push({ type: 'text', value });
}

function parseLinkDest(raw: string): { href: string; title?: string } {
  const trimmed = raw.trim();
  const titled = trimmed.match(/^<([^>]+)>\s*(?:"([^"]*)"|'([^']*)')?$/);
  if (titled && titled[1] !== undefined) {
    return { href: titled[1], title: titled[2] ?? titled[3] };
  }
  const match = trimmed.match(/^([^\s]+)(?:\s+(?:"([^"]*)"|'([^']*)'))?$/);
  return { href: match?.[1] ?? trimmed, title: match?.[2] ?? match?.[3] };
}

function findClosing(src: string, open: number, closer: string): number {
  let i = open;
  while (i < src.length) {
    if (src.charAt(i) === '\\') {
      i += 2;
      continue;
    }
    if (src.startsWith(closer, i)) return i;
    i += 1;
  }
  return -1;
}

export function parseInline(src: string, options: ParseMarkdownOptions = {}): MdInline[] {
  const breaks = options.breaks ?? true;
  const out: MdInline[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src.charAt(i);

    if (ch === '\\' && i + 1 < src.length) {
      pushText(out, src.charAt(i + 1));
      i += 2;
      continue;
    }

    if (ch === '`') {
      let ticks = 1;
      while (src.charAt(i + ticks) === '`') ticks += 1;
      const closer = '`'.repeat(ticks);
      const end = src.indexOf(closer, i + ticks);
      if (end !== -1) {
        out.push({ type: 'code', value: src.slice(i + ticks, end).replace(/\n/g, ' ') });
        i = end + ticks;
        continue;
      }
    }

    if (src.startsWith('![', i)) {
      const altEnd = findClosing(src, i + 2, ']');
      if (altEnd !== -1 && src.charAt(altEnd + 1) === '(') {
        const destEnd = findClosing(src, altEnd + 2, ')');
        if (destEnd !== -1) {
          const dest = parseLinkDest(src.slice(altEnd + 2, destEnd));
          if (isSafeUrl(dest.href, 'src')) {
            out.push({
              type: 'image',
              src: dest.href,
              alt: src.slice(i + 2, altEnd),
              title: dest.title,
            });
            i = destEnd + 1;
            continue;
          }
        }
      }
    }

    if (ch === '[') {
      const labelEnd = findClosing(src, i + 1, ']');
      if (labelEnd !== -1 && src.charAt(labelEnd + 1) === '(') {
        const destEnd = findClosing(src, labelEnd + 2, ')');
        if (destEnd !== -1) {
          const dest = parseLinkDest(src.slice(labelEnd + 2, destEnd));
          if (isSafeUrl(dest.href, 'href')) {
            out.push({
              type: 'link',
              href: dest.href,
              title: dest.title,
              children: parseInline(src.slice(i + 1, labelEnd), options),
            });
            i = destEnd + 1;
            continue;
          }
        }
      }
    }

    if (ch === '<') {
      const autolink = src.slice(i).match(/^<((?:https?:|mailto:)[^>\s]+)>/i);
      if (autolink && autolink[1] && isSafeUrl(autolink[1], 'href')) {
        out.push({
          type: 'link',
          href: autolink[1],
          children: [{ type: 'text', value: autolink[1] }],
        });
        i += autolink[0].length;
        continue;
      }

      if (looksLikeHtmlBlock(src.slice(i))) {
        const parsed = parseHtmlFromStart(src.slice(i));
        if (parsed) {
          out.push({ type: 'html', ast: parsed.ast });
          i += parsed.consumed;
          continue;
        }
      }
    }

    if (src.startsWith('~~', i)) {
      const end = findClosing(src, i + 2, '~~');
      if (end !== -1) {
        out.push({ type: 'del', children: parseInline(src.slice(i + 2, end), options) });
        i = end + 2;
        continue;
      }
    }

    if (src.startsWith('**', i) || src.startsWith('__', i)) {
      const delim = src.slice(i, i + 2);
      const end = findClosing(src, i + 2, delim);
      if (end !== -1) {
        out.push({ type: 'strong', children: parseInline(src.slice(i + 2, end), options) });
        i = end + 2;
        continue;
      }
    }

    if ((ch === '*' || ch === '_') && !(ch === '_' && isWordChar(src.charAt(i - 1)))) {
      const end = findClosing(src, i + 1, ch);
      if (end !== -1 && end > i + 1) {
        out.push({ type: 'em', children: parseInline(src.slice(i + 1, end), options) });
        i = end + 1;
        continue;
      }
    }

    if (ch === '\n') {
      if (breaks) out.push({ type: 'break' });
      else pushText(out, ' ');
      i += 1;
      continue;
    }

    if ((src.startsWith('http://', i) || src.startsWith('https://', i)) && (i === 0 || /\s|\(/.test(src.charAt(i - 1)))) {
      let end = i;
      while (end < src.length && /[^\s<>)\]`'"]/.test(src.charAt(end))) end += 1;
      while (end > i && /[.,;:!?]$/.test(src.charAt(end - 1))) end -= 1;
      const href = src.slice(i, end);
      if (isSafeUrl(href, 'href')) {
        out.push({ type: 'link', href, children: [{ type: 'text', value: href }] });
        i = end;
        continue;
      }
    }

    let nextSpecial = i + 1;
    while (nextSpecial < src.length) {
      const n = src.charAt(nextSpecial);
      if (n === '\\' || n === '`' || n === '[' || n === '!' || n === '<' || n === '*' || n === '_' || n === '~' || n === '\n') {
        break;
      }
      if (src.startsWith('http://', nextSpecial) || src.startsWith('https://', nextSpecial)) break;
      nextSpecial += 1;
    }
    pushText(out, src.slice(i, nextSpecial));
    i = nextSpecial;
  }

  return out;
}

function headingLevel(line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; text: string } | null {
  const match = line.match(/^(#{1,6})\s+(.*?)(?:\s+#*)?$/);
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  return { level: match[1].length as 1 | 2 | 3 | 4 | 5 | 6, text: match[2] };
}

function isHr(line: string): boolean {
  return /^\s{0,3}((-\s*){3,}|(\*\s*){3,}|(_\s*){3,})$/.test(line);
}

function fenceMatch(line: string): { fence: string; lang: string } | null {
  const match = line.match(/^(`{3,}|~{3,})([^\s]*)\s*$/);
  if (!match || match[1] === undefined) return null;
  return { fence: match[1], lang: match[2] ?? '' };
}

function splitTableRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|')) row = row.slice(0, -1);
  return row.split('|').map((cell) => cell.trim());
}

function parseAlign(line: string): Array<'left' | 'center' | 'right' | null> | null {
  const cells = splitTableRow(line);
  if (!cells.length || !cells.every((cell) => /^:?-{3,}:?$/.test(cell))) return null;
  return cells.map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return null;
  });
}

function listMarker(line: string): { ordered: boolean; start?: number; checked: boolean | null; rest: string; indent: number } | null {
  const match = line.match(/^(\s*)([-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.*)$/);
  if (!match || match[2] === undefined || match[4] === undefined) return null;
  const indent = match[1]?.length ?? 0;
  const marker = match[2];
  const ordered = /^\d/.test(marker);
  const start = ordered ? Number.parseInt(marker, 10) : undefined;
  const checked = match[3] === undefined ? null : match[3].toLowerCase() === 'x';
  return { ordered, start, checked, rest: match[4], indent };
}

function quotePrefix(line: string): string | null {
  const match = line.match(/^>\s?(.*)$/);
  return match ? (match[1] ?? '') : null;
}

function peekLine(src: string): { line: string; rest: string } {
  const idx = src.indexOf('\n');
  if (idx === -1) return { line: src, rest: '' };
  return { line: src.slice(0, idx), rest: src.slice(idx + 1) };
}

function takeParagraph(src: string): { text: string; rest: string } {
  const lines: string[] = [];
  let rest = src;
  while (rest.length) {
    const { line, rest: next } = peekLine(rest);
    if (line.trim() === '') break;
    if (headingLevel(line) || isHr(line) || fenceMatch(line) || looksLikeHtmlBlock(line) || listMarker(line) || quotePrefix(line) !== null) {
      break;
    }
    if (lines.length && parseAlign(line)) break;
    lines.push(line);
    rest = next;
  }
  return { text: lines.join('\n'), rest };
}

function takeIndentedBlock(src: string, minIndent: number): { text: string; rest: string } {
  const lines: string[] = [];
  let rest = src;
  while (rest.length) {
    const { line, rest: next } = peekLine(rest);
    if (line.trim() === '') {
      lines.push('');
      rest = next;
      continue;
    }
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (indent < minIndent && line.trim() !== '') break;
    lines.push(line.slice(Math.min(indent, minIndent)));
    rest = next;
  }
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return { text: lines.join('\n'), rest };
}

export function parseMarkdown(source: string, options: ParseMarkdownOptions = {}): MdBlock[] {
  let rest = source.replace(/\r\n?/g, '\n');
  const blocks: MdBlock[] = [];

  while (rest.length) {
    if (rest.startsWith('\n')) {
      rest = rest.slice(1);
      continue;
    }

    const { line, rest: afterLine } = peekLine(rest);

    if (line.trim() === '') {
      rest = afterLine;
      continue;
    }

    const fence = fenceMatch(line);
    if (fence) {
      rest = afterLine;
      const body: string[] = [];
      while (rest.length) {
        const next = peekLine(rest);
        if (next.line.startsWith(fence.fence)) {
          rest = next.rest;
          break;
        }
        body.push(next.line);
        rest = next.rest;
      }
      blocks.push({ type: 'code', lang: fence.lang || undefined, value: body.join('\n') });
      continue;
    }

    if (looksLikeHtmlBlock(rest)) {
      const parsed = parseHtmlFromStart(rest);
      if (parsed) {
        if (parsed.ast !== '') {
          blocks.push({ type: 'html', ast: parsed.ast });
        }
        rest = rest.slice(parsed.consumed).replace(/^\n/, '');
        continue;
      }
    }

    const heading = headingLevel(line);
    if (heading) {
      blocks.push({
        type: 'heading',
        level: heading.level,
        children: parseInline(heading.text, options),
      });
      rest = afterLine;
      continue;
    }

    if (isHr(line)) {
      blocks.push({ type: 'hr' });
      rest = afterLine;
      continue;
    }

    const quoted = quotePrefix(line);
    if (quoted !== null) {
      const quoteLines: string[] = [];
      while (rest.length) {
        const next = peekLine(rest);
        const inner = quotePrefix(next.line);
        if (inner === null) break;
        quoteLines.push(inner);
        rest = next.rest;
      }
      blocks.push({ type: 'blockquote', children: parseMarkdown(quoteLines.join('\n'), options) });
      continue;
    }

    const marker = listMarker(line);
    if (marker) {
      const ordered = marker.ordered;
      const items: MdListItem[] = [];
      let start = marker.start;
      while (rest.length) {
        const next = peekLine(rest);
        const nextMarker = listMarker(next.line);
        if (!nextMarker || nextMarker.ordered !== ordered || nextMarker.indent > 0) break;
        rest = next.rest;
        const nested = takeIndentedBlock(rest, (nextMarker.indent || 0) + 2);
        rest = nested.rest;
        const itemMd = [nextMarker.rest, nested.text].filter(Boolean).join('\n');
        items.push({
          checked: nextMarker.checked,
          children: parseMarkdown(itemMd, options),
        });
        if (start === undefined) start = nextMarker.start;
      }
      blocks.push({ type: 'list', ordered, start, items });
      continue;
    }

    const headerCells = splitTableRow(line);
    const maybeAlign = peekLine(afterLine);
    const align = parseAlign(maybeAlign.line);
    if (line.includes('|') && align && align.length === headerCells.length) {
      rest = maybeAlign.rest;
      const rows: MdInline[][][] = [];
      while (rest.length) {
        const next = peekLine(rest);
        if (!next.line.includes('|') || next.line.trim() === '') break;
        rows.push(splitTableRow(next.line).map((cell) => parseInline(cell, options)));
        rest = next.rest;
      }
      blocks.push({
        type: 'table',
        align,
        header: headerCells.map((cell) => parseInline(cell, options)),
        rows,
      });
      continue;
    }

    const para = takeParagraph(rest);
    if (para.text) {
      blocks.push({ type: 'paragraph', children: parseInline(para.text, options) });
      rest = para.rest;
      continue;
    }

    rest = afterLine;
  }

  return blocks;
}
