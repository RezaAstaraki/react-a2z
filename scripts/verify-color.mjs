/**
 * Verification harness for the colour primitives (`src/utils/color.ts`).
 *
 *     node scripts/verify-color.mjs
 *
 * These are pure functions doing real math (HSL conversion, WCAG luminance),
 * which is exactly the kind of code that looks right and is subtly wrong. The
 * cases below pin the surprising ones so nobody later 'fixes' correct
 * behaviour — notably that `bad` IS a valid hex colour (b, a, d are all hex
 * digits, so it expands to #bbaadd).
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const load = (rel) => import(pathToFileURL(resolve(root, rel)).href);

let failures = 0;
const eq = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(
    (ok ? '  \u2713 ' : '  \u2717 ') +
      label +
      (ok ? '' : `\n      got:  ${JSON.stringify(actual)}\n      want: ${JSON.stringify(expected)}`),
  );
};

console.log('\ncolour primitives');
const {
  normalizeHex, isValidHex, hexToRgb, rgbToHex, hslToHex,
  luminance, readableForeground, withAlpha,
} = await load('dist/esm/utils/color.js');

// --- normalizeHex ---
eq('normalizeHex("#ABC") lowercases', normalizeHex('#ABC'), '#aabbcc');
eq('normalizeHex("abc") adds the hash', normalizeHex('abc'), '#aabbcc');
eq('normalizeHex trims whitespace', normalizeHex('  #AABBCC  '), '#aabbcc');
eq('normalizeHex rejects non-hex', normalizeHex('#zzz'), null);
eq('normalizeHex rejects bad length', normalizeHex('#12345'), null);
eq('bad is a valid colour', normalizeHex('bad'), '#bbaadd');

// --- isValidHex ---
eq('isValidHex accepts shorthand', isValidHex('#fff'), true);
eq('isValidHex rejects words', isValidHex('nope'), false);

// --- hexToRgb / rgbToHex ---
eq('hexToRgb splits channels', hexToRgb('#ff8000'), { r: 255, g: 128, b: 0 });
eq('hexToRgb rejects invalid', hexToRgb('xyz'), null);
eq('rgbToHex clamps out-of-range', rgbToHex({ r: 300, g: -20, b: 128 }), '#ff0080');

// --- hslToHex ---
eq('hslToHex red', hslToHex(0, 1, 0.5), '#ff0000');
eq('hslToHex green', hslToHex(120, 1, 0.5), '#00ff00');
eq('hslToHex blue', hslToHex(240, 1, 0.5), '#0000ff');
eq('hslToHex wraps 360', hslToHex(360, 1, 0.5), '#ff0000');
eq('hslToHex wraps negative hue', hslToHex(-120, 1, 0.5), '#0000ff');

// --- luminance / readableForeground ---
eq('luminance white is 1', luminance('#ffffff'), 1);
eq('luminance black is 0', luminance('#000000'), 0);
eq('readableForeground on white', readableForeground('#ffffff'), '#000000');
eq('readableForeground on black', readableForeground('#000000'), '#ffffff');
eq('readableForeground on primary', readableForeground('#2563eb'), '#ffffff');

// --- withAlpha ---
eq('withAlpha builds rgba', withAlpha('#ff0000', 0.5), 'rgba(255, 0, 0, 0.5)');
eq('withAlpha clamps above 1', withAlpha('#ff0000', 5), 'rgba(255, 0, 0, 1)');
eq('withAlpha is transparent on invalid', withAlpha('nope', 0.5), 'rgba(0, 0, 0, 0)');

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) FAILED.\n`);
process.exit(failures === 0 ? 0 : 1);
