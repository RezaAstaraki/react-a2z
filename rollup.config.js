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

/** The CJS output sits inside a `"type": "module"` package, so its `.js` files
 *  would be parsed as ESM and `require('react-a2z')` would fail. Mark dist/cjs
 *  as CommonJS so the `require` export condition actually works. */
function cjsPackageJson() {
  return {
    name: 'cjs-package-json',
    generateBundle(options) {
      const dir = (options.dir || '').replace(/\\/g, '/');
      if (!dir.endsWith('/cjs')) return;
      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: '{"type":"commonjs"}\n',
      });
    },
  };
}

// Rollup occasionally writes every output file and then fails to exit
// because some plugin leaves a handle open. Both configs call forceExit()
// from closeBundle; when the last one fires, we exit explicitly. By that
// point every file is on disk, so an explicit exit is safe.
let _closedBundles = 0;
const _TOTAL_BUNDLES = 2;
function forceExit() {
  return {
    name: 'force-exit',
    closeBundle() {
      if (++_closedBundles >= _TOTAL_BUNDLES) {
        // Delay exit so rollup can flush its final "created ..." summary
        // line. .unref() means this timer does NOT keep the loop alive: if
        // rollup exits naturally first, the timer never fires. If a plugin
        // leaked a handle, the loop is still alive and the timer fires
        // at 500 ms.
        setTimeout(() => process.exit(0), 500).unref();
      }
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
    external: ['clsx', 'tailwind-merge'],
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
      terser({ compress: { directives: false }, maxWorkers: 1 }),
      cjsPackageJson(),
      forceExit(),
    ],
  },
  {
    input: 'src/index.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts.default(), forceExit()],
    external: [/\.css$/],
  },
];
