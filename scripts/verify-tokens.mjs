/**
 * Verification harness for the react-a2z token layer.
 *
 * Not a jest suite (the repo has a jest script but no tests or config); this is a
 * dependency-free check you can run after any build:
 *
 *     node scripts/verify-tokens.mjs
 *
 * It asserts the three behaviours the whole customization story rests on:
 *   1. every package.json export subpath resolves to an emitted file
 *   2. `cn` merges a2z TOKEN classes last-one-wins (the reason cn was rewritten)
 *   3. the slot-aware recipe resolves per-slot, compound, and boolean variants
 */
import { createRequire } from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
/** Windows absolute paths must become file:// URLs before dynamic import. */
const load = (rel) => import(pathToFileURL(resolve(root, rel)).href);

let failures = 0;
const ok = (label) => console.log(`  \u2713 ${label}`);
const fail = (label, detail) => {
  failures += 1;
  console.log(`  \u2717 ${label}${detail ? `\n      ${detail}` : ''}`);
};

const assertEqual = (label, actual, expected) => {
  if (actual === expected) ok(label);
  else fail(label, `expected: ${expected}\n      actual:   ${actual}`);
};

const assertIncludes = (label, haystack, needle) => {
  if (haystack.includes(needle)) ok(label);
  else fail(label, `expected to contain: ${needle}\n      actual: ${haystack}`);
};

const assertNotIncludes = (label, haystack, needle) => {
  if (!haystack.includes(needle)) ok(label);
  else fail(label, `expected NOT to contain: ${needle}\n      actual: ${haystack}`);
};

/* ---------------------------------------------------------------- 1. exports */
console.log('\n1. package.json#exports subpaths');
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
for (const [key, value] of Object.entries(pkg.exports)) {
  const targets = typeof value === 'object' ? Object.values(value) : [value];
  const missing = targets.filter((t) => typeof t === 'string' && t.endsWith('.css') || t.endsWith('.js'))
    .filter((t) => !existsSync(resolve(root, t)));
  if (missing.length === 0) ok(`${key} -> resolves`);
  else fail(`${key} -> MISSING ${missing.join(', ')}`);
}

/* ------------------------------------------------------- 2. token-aware cn() */
console.log('\n2. cn() token-aware merging');
const { cn } = await load('dist/esm/utils/cn.js');

// The behaviour that motivated rewriting cn: a bare twMerge keeps BOTH classes
// here, and the winner becomes stylesheet order instead of argument order.
assertEqual(
  'consumer bg beats library bg',
  cn('bg-primary-600', 'bg-red-500'),
  'bg-red-500',
);
assertEqual(
  'consumer text color beats library text color',
  cn('text-primary-700', 'text-white'),
  'text-white',
);
assertEqual(
  'consumer border color beats library border color',
  cn('border-border', 'border-transparent'),
  'border-transparent',
);
assertEqual(
  'consumer ring color beats library ring color',
  cn('ring-primary-500', 'ring-offset-2'),
  'ring-primary-500 ring-offset-2',
);
assertEqual(
  'token px/py still merge against numeric',
  cn('px-4 py-3', 'px-2'),
  'py-3 px-2',
);
assertEqual(
  'slot class beats variant default (same family)',
  cn('bg-primary-600', 'bg-primary-soft'),
  'bg-primary-soft',
);
assertEqual(
  'unrelated classes all survive',
  cn('rounded-lg', 'font-medium', 'cursor-pointer'),
  'rounded-lg font-medium cursor-pointer',
);
assertEqual(
  'a2z rounded token beats tailwind rounded',
  cn('rounded-lg', 'rounded-full'),
  'rounded-full',
);
assertEqual(
  'a2z shadow token beats tailwind shadow',
  cn('shadow-sm', 'shadow-xl'),
  'shadow-xl',
);

/* ------------------------------------------------------------- 3. recipe API */
console.log('\n3. slot-aware recipe');
const { createRecipe } = await load('dist/esm/utils/recipe.js');

const button = createRecipe({
  base: { root: 'inline-flex rounded-md', label: 'font-medium' },
  variants: {
    size: {
      sm: { root: 'h-8 px-3', label: 'text-sm' },
      lg: { root: 'h-12 px-6', label: 'text-base' },
    },
    tone: {
      danger: { root: 'bg-danger-600 text-danger-fg', label: '' },
      plain: { root: 'bg-surface' },
    },
  },
  booleans: { fullWidth: { true: 'w-full' } },
  defaultVariants: { size: 'sm' },
  compoundVariants: [{ size: 'lg', tone: 'danger', class: 'uppercase' }],
});

const a = button({});
assertIncludes('base applied', a.root, 'inline-flex');
assertIncludes('default variant applied', a.root, 'h-8');
assertIncludes('slot variant applied', a.label, 'text-sm');

const b = button({ size: 'lg', tone: 'danger' });
assertIncludes('explicit variant overrides default', b.root, 'h-12');
assertIncludes('compound variant fires on the match', b.root, 'uppercase');
assertIncludes('colour variant applied', b.root, 'bg-danger-600');
assertNotIncludes('default size replaced, not duplicated', b.root, 'h-8');

const c = button({ fullWidth: true });
assertIncludes('boolean flag applied', c.root, 'w-full');

const d = button({ size: 'lg', className: 'bg-red-500' });
assertIncludes('className lands on root', d.root, 'bg-red-500');
assertNotIncludes('className beats variant colour', d.root, 'bg-danger-600');

const e = button({ size: 'lg', tone: 'plain', className: 'rounded-full' });
assertIncludes('className beats base slot class', e.root, 'rounded-full');
assertNotIncludes('base rounded replaced', e.root, 'rounded-md');

/* --------------------------------------------------------- 4. token coverage */
console.log('\n4. token layer files');
const tokensCss = readFileSync(resolve(root, 'tokens.css'), 'utf8');
const preset = readFileSync(resolve(root, 'tailwind.preset.js'), 'utf8');
for (const needle of ['--a2z-primary-600', '--a2z-radius', '--a2z-ring', '.a2z-dark']) {
  assertIncludes(`tokens.css declares ${needle}`, tokensCss, needle);
}
for (const needle of ['primary', 'neutral', 'success', 'warning', 'danger', 'info']) {
  assertIncludes(`v3 preset maps ${needle}`, preset, needle);
}
assertIncludes('v3 preset uses the alpha placeholder', preset, '<alpha-value>');

// Raw palette utilities are banned in MIGRATED components; everything else is
// tracked as pending. Add a component here in the same commit you migrate it —
// the assertion then covers it automatically, instead of only the two files
// this check started with. See ROADMAP.md.
const MIGRATED = [
  'src/components/Button/Button.tsx',
  'src/components/Input/Input.tsx',
  'src/components/Slider/Slider.tsx',
];

const componentDir = resolve(root, 'src/components');
const allComponentFiles = readdirSync(componentDir, { recursive: true })
  .filter((f) => typeof f === 'string' && f.endsWith('.tsx'))
  .map((f) => 'src/components/' + f.replace(/\\/g, '/'));

// from/to/via catch gradient utilities, which a bg|text|border|ring regex misses.
const RAINBOW = /\b(bg|text|border|ring|from|to|via)-(blue|red|green|gray|emerald|sky|amber|orange|indigo|purple|slate|zinc|yellow|teal|violet|rose|lime|pink)-[0-9]{2,3}\b/g;

// A rename would silently drop a file from the assertion; assert they exist.
for (const rel of MIGRATED) {
  assertEqual(`${rel} exists`, existsSync(resolve(root, rel)) ? 'yes' : 'no', 'yes');
}

const pending = [];
for (const rel of allComponentFiles) {
  const src = readFileSync(resolve(root, rel), 'utf8');
  const stray = [...src.matchAll(RAINBOW)].map((m) => m[0]);
  if (MIGRATED.includes(rel)) {
    assertEqual(`${rel} is token-clean`, stray.join(','), '');
  } else if (stray.length > 0) {
    pending.push(rel);
  }
}

console.log(`  i ${MIGRATED.length} migrated, ${pending.length} pending migration`);
for (const rel of pending) console.log(`      pending: ${rel}`);

/* --------------------------------------------------------------------- done */
console.log(
  failures === 0
    ? '\nAll checks passed.\n'
    : `\n${failures} check(s) FAILED.\n`,
);
process.exit(failures === 0 ? 0 : 1);
