import path from "node:path";
import { fileURLToPath } from "node:url";

/** @internal */
interface ITtscPluginFactoryContext {
  projectRoot: string;
}

/**
 * @internal
 *
 * The `composes` array order is load-bearing: `typia/lib/transform` first
 * (host), then peers consumed by the Go binary's `plugin.ParsePlan`.
 */
interface ITtscPlugin {
  name: string;
  source: string;
  composes: string[];
}

const filename: string = currentFilename();
const dirname: string = path.dirname(filename);

export function createTtscPlugin(
  context: ITtscPluginFactoryContext,
): ITtscPlugin {
  const root: string =
    resolvePackageRoot("@nestia/core/package.json", context.projectRoot) ??
    inferPackageRoot();
  return {
    name: "@nestia/core",
    source: path.resolve(root, "native", "cmd", "ttsc-nestia"),
    composes: [
      "typia/lib/transform",
      "@nestia/sdk/lib/transform",
    ],
  };
}
export default createTtscPlugin;

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

function inferPackageRoot(): string {
  return path.resolve(dirname, "..");
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
