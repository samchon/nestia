import commonjs from "@rollup/plugin-commonjs";
import esmShim from "@rollup/plugin-esm-shim";
import nodeResolve from "@rollup/plugin-node-resolve";
import nodeExternals from "rollup-plugin-node-externals";
import { globSync } from "tinyglobby";

// Borrowed from typia's `config/rollup.config.mjs`. The ESM publish artifact
// is transcoded from the CJS `lib/*.js` that `ttsc` already emitted, rather
// than re-compiled from `src/*.ts` via `@rollup/plugin-typescript`. This drops
// the build-only `typescript` peer entirely (TypeScript 7 ships as a native
// compiler) and keeps a single source of truth for the compiled output.
export default {
  input: globSync("./lib/**/*.js"),
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
    preserveModulesRoot: "lib",
  },
  plugins: [
    // Some sources use the CJS globals `__dirname`/`__filename`. esm-shim
    // derives them from `import.meta.url` so the transcoded `.mjs` stays
    // correct in ESM too.
    esmShim(),
    nodeExternals(),
    nodeResolve(),
    commonjs({
      strictRequires: false,
    }),
  ],
};
