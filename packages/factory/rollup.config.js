// Emits the dual-format publish artifact (`lib/*.js` CJS + `lib/*.mjs`
// ESM). `@rollup/plugin-typescript` stays here because rollup needs to
// re-compile the TypeScript source to ESM with statically-discoverable
// named exports — consumers like @nestia/editor's vite build cannot
// pull named symbols out of a CJS module that uses dynamic
// `__exportStar`. No nestia source file imports from `typescript`; the
// dep is build-pipeline-only.

const typescript = require("@rollup/plugin-typescript");

module.exports = {
  input: "./src/index.ts",
  output: {
    dir: "lib",
    format: "esm",
    entryFileNames: "[name].mjs",
    preserveModules: true,
    preserveModulesRoot: "src",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
      module: "ESNext",
      moduleResolution: "Bundler",
      target: "ESNext",
    }),
  ],
};
