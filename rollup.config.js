import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: "./dist/cjs/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "./dist/esm/index.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", declaration: false }),
    ],
  },
  //   {
  //     input: "./dist/types/src/index.d.ts",
  //     output: [{ file: "dist/esm/index.d.ts", format: "esm" }],
  //     plugins: [dts()],
  //   },
];
