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
 *
 * @evidence contracts/common.md#principled-implementation The package root is resolved through `@nestia/sdk/package.json` from the consumer's project, so the source path is the installed package's, not a workspace layout, and the descriptor returns only a name and a source directory.
 * @evidence contracts/common.md#clear-and-simple-design One function returning two properties; the transform itself is native.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The resolution goes through the package manifest, as the development rules require, and nothing is patched.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the descriptor returns.
 * @evidence contracts/portability.md#os-neutral-implementation createRequire anchors package resolution to the consumer project's package.json; Node resolution yields the installed manifest's native pathname and path.dirname/path.resolve derive the contributor source without a workspace-specific separator or shell lookup.
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
