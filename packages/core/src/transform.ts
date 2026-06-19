import { createRequire } from "node:module";
import path from "node:path";
import type { ITtscPlugin, ITtscPluginFactoryContext } from "ttsc";

/**
 * `@nestia/core` ttsc plugin descriptor.
 *
 * `@nestia/sdk` is not a standalone plugin: its Go transform is declared here
 * as a `contributor` that ttsc statically links into this host binary, and only
 * when `@nestia/sdk` is actually resolvable from the project. A project
 * depending on `@nestia/core` alone never compiles any SDK transform code.
 */
export default function createTtscPlugin(
  context: ITtscPluginFactoryContext,
): ITtscPlugin {
  const requireFrom = createRequire(
    path.join(context.projectRoot, "package.json"),
  );
  const root: string = path.dirname(
    requireFrom.resolve("@nestia/core/package.json"),
  );
  return {
    name: "@nestia/core",
    source: path.resolve(root, "native", "cmd", "ttsc-nestia"),
  };
}
