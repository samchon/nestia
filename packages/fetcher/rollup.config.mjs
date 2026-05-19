// Emits the dual-format publish artifact (`lib/*.js` CJS + `lib/*.mjs`
// ESM). `@rollup/plugin-typescript` stays here because rollup needs to
// re-compile the TypeScript source to ESM with statically-discoverable
// named exports — consumers cannot pull named symbols out of a CJS
// module that uses dynamic `__exportStar`. No nestia source file
// imports from `typescript`; the dep is build-pipeline-only.

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import autoExternal from "rollup-plugin-auto-external";
import nodeExternals from "rollup-plugin-node-externals";
import { globSync } from "tinyglobby";

export default {
  input: globSync("./src/**/*.ts"),
  external: (id) => /node_modules/.test(id),
  output: {
    dir: "./lib",
    format: "esm",
    sourcemap: true,
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.name.includes("node_modules")) {
        throw new Error(`Invalid chunk name: ${chunkInfo.name}`);
      }
      return `[name].mjs`;
    },
    preserveModules: true,
    preserveModulesRoot: "src",
  },
  plugins: [
    nodeExternals(),
    autoExternal(),
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: "tsconfig.json",
      module: "ESNext",
      target: "ESNext",
    }),
  ],
};
