import { twMerge } from 'tailwind-merge';

/**
 * Which token NAMES does the default (zero-config) tailwind-merge validator
 * actually merge? The default bg-color group is {bg:[null,null,null]} — i.e.
 * "bg-<x>-<y>" — so segment count is the deciding factor.
 */
const pairs = [
  // three-segment candidates
  ['bg-primary-600', 'bg-primary-700'],
  ['bg-primary-soft', 'bg-primary-soft-hover'],
  ['bg-primary-600', 'bg-primary-soft'],
  ['bg-surface-base', 'bg-surface-raised'],
  ['bg-neutral-subtle', 'bg-neutral-subtle-hover'],
  ['text-fg-muted', 'text-fg-base'],
  ['text-fg-muted', 'text-primary-700'],
  ['border-border-base', 'border-border-strong'],
  ['border-primary-600', 'border-danger-500'],
  ['ring-primary-500', 'ring-ring-base'],
  ['ring-offset-ring-base', 'ring-offset-2'],
  // two-segment candidates (expected to fail / not merge)
  ['bg-surface', 'bg-surface-raised'],
  ['text-fg', 'text-fg-muted'],
  ['border-border', 'border-border-strong'],
  ['ring-ring', 'ring-primary-500'],
];

for (const [a, b] of pairs) {
  const out = twMerge(a, b);
  const ok = out === b;
  console.log(`${ok ? 'OK ' : 'BAD'}  ${a.padEnd(28)} + ${b.padEnd(28)} -> ${out}`);
}

console.log('\n--- does the arbitrary-value form merge consistently? ---');
for (const [a, b] of [
  ['bg-[--a2z-primary-600]', 'bg-[--a2z-neutral-100]'],
  ['text-[--a2z-fg-muted]', 'text-[--a2z-danger-600]'],
]) {
  const out = twMerge(a, b);
  console.log(`${out === b ? 'OK ' : 'BAD'}  ${a} + ${b} -> ${out}`);
}
