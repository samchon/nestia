// Node ESM loader for fixture `nestia.config.ts` files materialized by
// ttsc under `<feature>/node_modules/.cache/ttsc/ttsx/project/<id>/fs/`.
// Node 24's `--experimental-strip-types` refuses to strip `.ts` files
// rooted under any `node_modules` directory, so the materialized
// configs cannot run with stock Node + ttsx.
//
// This loader intercepts just those config sources and transpiles them
// via the workspace `tsgo` binary — no `typescript` package needed.
// Every other module continues through Node's default resolver.

import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const CONFIG_FILES = new Set(["nestia.config.ts", "nestia.configuration.ts"]);
const TSGO_BIN = path.resolve(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "node_modules",
  ".bin",
  "tsgo",
);

const decodedBasename = (url) => {
  try {
    return path.basename(fileURLToPath(url));
  } catch {
    return "";
  }
};

export async function resolve(specifier, context, nextResolve) {
  const url = specifier.startsWith("file:")
    ? specifier
    : context.parentURL === undefined
      ? pathToFileURL(path.resolve(specifier)).href
      : new URL(specifier, context.parentURL).href;
  if (url.startsWith("file:") && CONFIG_FILES.has(decodedBasename(url))) {
    return { shortCircuit: true, url };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && CONFIG_FILES.has(decodedBasename(url))) {
    const filename = fileURLToPath(url);
    // tsgo internally spawns Node; clear NODE_OPTIONS so its child does not
    // inherit this loader (it would re-enter, warn about the experimental
    // flag, and exit non-zero).
    const cleanEnv = { ...process.env };
    delete cleanEnv.NODE_OPTIONS;
    const result = spawnSync(
      TSGO_BIN,
      [
        "--ignoreConfig",
        "--target",
        "ES2022",
        "--module",
        "CommonJS",
        "--esModuleInterop",
        "--isolatedModules",
        "--skipLibCheck",
        "--noCheck",
        "--outDir",
        path.dirname(filename),
        filename,
      ],
      { encoding: "utf8", env: cleanEnv },
    );
    const compiled = filename.replace(/\.ts$/, ".js");
    try {
      const source = await fs.readFile(compiled, "utf8");
      return { format: "commonjs", shortCircuit: true, source };
    } catch {
      // Fall back to the raw source so the consumer sees the genuine
      // syntax/type error rather than a confusing loader stack frame.
      if (result.stderr || result.stdout) {
        process.stderr.write(
          `config-ts-loader: tsgo transpile of ${filename} failed.\n` +
            (result.stderr || result.stdout || ""),
        );
      }
      const source = await fs.readFile(filename, "utf8");
      return { format: "commonjs", shortCircuit: true, source };
    }
  }
  return nextLoad(url, context);
}
