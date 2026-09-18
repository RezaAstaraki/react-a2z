export function indentSelection(value: string, start: number, end: number, indent = '  ') {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = end === start ? value.indexOf('\n', end) : value.indexOf('\n', end - 1);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, Math.max(blockEnd, end));
  const indented = block
    .split('\n')
    .map((line) => indent + line)
    .join('\n');
  const next = value.slice(0, lineStart) + indented + value.slice(lineStart + block.length);
  return {
    value: next,
    selectionStart: start + indent.length,
    selectionEnd: end + indent.length * block.split('\n').length,
  };
}

export function outdentSelection(value: string, start: number, end: number, indent = '  ') {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = end === start ? value.indexOf('\n', end) : value.indexOf('\n', end - 1);
  const blockEnd = lineEnd === -1 ? value.length : lineEnd;
  const block = value.slice(lineStart, Math.max(blockEnd, end));
  const lines = block.split('\n');
  let removedBeforeCursor = 0;
  let removedTotal = 0;
  const outdented = lines
    .map((line, index) => {
      const remove = line.startsWith(indent) ? indent.length : line.startsWith('\t') ? 1 : line.startsWith(' ') ? 1 : 0;
      if (index === 0) removedBeforeCursor = remove;
      removedTotal += remove;
      return line.slice(remove);
    })
    .join('\n');
  const next = value.slice(0, lineStart) + outdented + value.slice(lineStart + block.length);
  return {
    value: next,
    selectionStart: Math.max(lineStart, start - removedBeforeCursor),
    selectionEnd: Math.max(lineStart, end - removedTotal),
  };
}

const LIST_LINE =
  /^([ \t]*)([-*+]|\d+[.)])(\s+)(?:(\[[ xX]\])\s+)?(.*)$/;

export function continueListOnEnter(value: string, cursor: number): { value: string; selection: number } | null {
  const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
  const lineEnd = value.indexOf('\n', cursor);
  const end = lineEnd === -1 ? value.length : lineEnd;
  if (cursor < lineStart || cursor > end) return null;
  const line = value.slice(lineStart, end);
  const match = line.match(LIST_LINE);
  if (!match) return null;

  const indent = match[1] ?? '';
  const marker = match[2] ?? '-';
  const space = match[3] ?? ' ';
  const checkbox = match[4];
  const content = match[5] ?? '';

  // Empty item → exit the list.
  if (!content.trim()) {
    const next = value.slice(0, lineStart) + value.slice(end);
    return { value: next, selection: lineStart };
  }

  let nextMarker = marker;
  if (/^\d/.test(marker)) {
    const num = Number.parseInt(marker, 10) + 1;
    nextMarker = `${num}${marker.endsWith(')') ? ')' : '.'}`;
  }
  const checkboxPart = checkbox ? '[ ] ' : '';
  const insertion = `\n${indent}${nextMarker}${space}${checkboxPart}`;
  const next = value.slice(0, cursor) + insertion + value.slice(cursor);
  return { value: next, selection: cursor + insertion.length };
}

export function toggleNthTask(markdown: string, index: number, checked: boolean): string {
  let current = 0;
  return markdown.replace(/^([ \t]*(?:[-*+]|\d+[.)])\s+)\[([ xX])\]/gm, (full, prefix: string) => {
    if (current++ !== index) return full;
    return `${prefix}[${checked ? 'x' : ' '}]`;
  });
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
