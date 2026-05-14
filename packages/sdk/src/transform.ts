import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ITtscPlugin, ITtscPluginFactoryContext } from "ttsc";
import ts from "typescript";

import { SdkOperationTransformer } from "./transformers/SdkOperationTransformer";

const filename: string = currentFilename();
const dirname: string = path.dirname(filename);

export function createTtscPlugin(
  context: ITtscPluginFactoryContext,
): ITtscPlugin {
  const root: string =
    resolvePackageRoot("@nestia/core/package.json", context.projectRoot) ??
    inferCorePackageRoot();
  const plugin: ITtscPlugin = {
    name: "@nestia/sdk",
    source: path.resolve(root, "native", "cmd", "ttsc-nestia"),
  };
  return plugin;
}

export const transform = (
  program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> =>
  SdkOperationTransformer.iterateFile(program.getTypeChecker());
export default transform;

function resolvePackageRoot(
  packageJson: string,
  projectRoot: string,
): string | null {
  try {
    return path.dirname(require.resolve(packageJson, { paths: [projectRoot] }));
  } catch {
    return null;
  }
}

function inferCorePackageRoot(): string {
  return path.resolve(dirname, "..", "..", "core");
}

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
