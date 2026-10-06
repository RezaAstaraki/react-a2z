import { readFileSync } from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

/** Re-add "use client" / "use server" stripped by Rollup when preserveModules is enabled. */
function preserveDirectives() {
  return {
    name: 'preserve-directives',
    renderChunk(code, chunk) {
      const id = chunk.facadeModuleId;
      if (!id) return null;

      const source = readFileSync(id, 'utf8');
      const match = source.match(/^(['"])use (client|server)\1;?\s*/);
      if (!match) return null;

      const directive = `'use ${match[2]}';`;
      if (code.startsWith(directive)) return null;

      return { code: `${directive}\n${code}`, map: null };
    },
  };
}

const preservedOutput = {
  preserveModules: true,
  preserveModulesRoot: 'src',
  entryFileNames: '[name].js',
  sourcemap: true,
};

// package.json#exports points at `.../X/index.js` for several barrels.
// Rollup flattens pure re-export modules unless they're explicit entry
// points, so list them here alongside the main entry.
const entries = [
  'src/index.ts',
  'src/hooks/index.ts',
  'src/components/Modal/index.ts',
  'src/components/Toast/index.ts',
  'src/components/ColorPicker/index.ts',
  'src/components/Md/index.ts',
  'src/components/MdEditor/index.ts',
  'src/components/Counter/index.ts',
];

export default [
  {
    input: entries,
    output: [
      {
        dir: "./dist/cjs",
        format: "cjs",
        exports: "named",
        interop: "auto",
        esModule: true,
        ...preservedOutput,
      },
      {
        dir: './dist/esm',
        format: 'esm',
        ...preservedOutput,
      },
    ],
    onwarn(warning, warn) {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
      warn(warning);
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      preserveDirectives(),
      typescript({ declaration: false, sourceMap: true }),
      terser({ compress: { directives: false } }),
    ],
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts.default()],
    external: [/\.css$/],
  },
];
