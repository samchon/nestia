import path from "node:path";
import { fileURLToPath } from "node:url";

interface ITtscPlugin {
  name: string;
  source: string;
}

const filename: string = currentFilename();
const dirname: string = path.dirname(filename);

/**
 * `@nestia/sdk` ttsc plugin descriptor.
 *
 * Points ttsc at this package's own Go source (`native/sdk`, package `sdk`).
 * Because that package is not `package main`, ttsc classifies it as a linked
 * transform and statically links it into the `@nestia/core` host binary as a
 * contributor — but only for projects that actually depend on `@nestia/sdk`.
 * A project depending on `@nestia/core` alone never links, compiles, or ships
 * any of this SDK transform code.
 */
export function createTtscPlugin(): ITtscPlugin {
  // `<root>/lib/transform.js` (published) or `<root>/src/transform.ts` (dev)
  // → `<root>` → the `native/sdk` linked-transform source package.
  const root: string = path.resolve(dirname, "..");
  return {
    name: "@nestia/sdk",
    source: path.resolve(root, "native", "sdk"),
  };
}
export default createTtscPlugin;

function currentFilename(): string {
  if (
    typeof __filename === "string" &&
    __filename !== "[stdin]" &&
    __filename.length !== 0
  )
    return normalizeFilename(__filename);

  const line: string | undefined = new Error().stack
    ?.split("\n")
    .find(
      (entry) =>
        entry.includes("/src/transform.ts") ||
        entry.includes("/lib/transform.js") ||
        entry.includes("/lib/transform.mjs"),
    );
  const matched: RegExpMatchArray | null | undefined = line?.match(
    /\(([^()]+):\d+:\d+\)|at ([^\s()]+):\d+:\d+/,
  );
  const fallback: string = typeof __filename === "string" ? __filename : "";
  return normalizeFilename(matched?.[1] ?? matched?.[2] ?? fallback);
}

function normalizeFilename(value: string): string {
  if (value.startsWith("file:")) return fileURLToPath(value);
  return value;
}
