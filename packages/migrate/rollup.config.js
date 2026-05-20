// Emits the dual-format publish artifact. `@rollup/plugin-typescript` is
// the only piece in the workspace that still pulls in the `typescript`
// peer; it stays here because vite/rollup consumers (e.g. @nestia/editor)
// need statically-discoverable named ESM exports, which the alternative
// "compile to CJS via ttsc, then commonjs() → ESM" pipeline cannot
// produce: `__exportStar(require("./module"), exports)` defeats the
// static analyzer. No nestia source file imports from `typescript`.

const typescript = require("@rollup/plugin-typescript");
const terser = require("@rollup/plugin-terser");

module.exports = {
  input: "./src/index.ts",
  output: {
    dir: "lib",
    format: "esm",
    entryFileNames: "[name].mjs",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.json",
      module: "ES2020",
      target: "ES2020",
    }),
    terser({
      format: {
        comments: "some",
        beautify: true,
        ecma: "2020",
      },
      compress: false,
      mangle: false,
      module: true,
    }),
  ],
};
