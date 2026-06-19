import { createRequire } from "node:module";
import path from "node:path";
import type { ITtscPlugin, ITtscPluginFactoryContext } from "ttsc";

/**
 * `@nestia/sdk` ttsc plugin descriptor.
 *
 * Points ttsc at this package's own Go source (`native/sdk`, package `sdk`).
 * Because that package is not `package main`, ttsc classifies it as a linked
 * transform and statically links it into the `@nestia/core` host binary as a
 * contributor — but only for projects that actually depend on `@nestia/sdk`. A
 * project depending on `@nestia/core` alone never links, compiles, or ships any
 * of this SDK transform code.
 */
export default function createTtscPlugin(
  context: ITtscPluginFactoryContext,
): ITtscPlugin {
  const requireFrom = createRequire(
    path.join(context.projectRoot, "package.json"),
  );
  const root: string = path.dirname(
    requireFrom.resolve("@nestia/sdk/package.json"),
  );
  return {
    name: "@nestia/sdk",
    source: path.resolve(root, "native", "sdk"),
  };
}
