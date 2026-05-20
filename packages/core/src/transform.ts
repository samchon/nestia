import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** @internal */
interface ITtscPluginFactoryContext {
  projectRoot: string;
}

/** @internal */
interface ITtscPlugin {
  name: string;
  source: string;
  composes: string[];
  contributors?: { name: string; source: string }[];
}

const filename: string = currentFilename();
const dirname: string = path.dirname(filename);

/**
 * `@nestia/core` ttsc plugin descriptor.
 *
 * `@nestia/sdk` is not a standalone plugin: its Go transform is declared here
 * as a `contributor` that ttsc statically links into this host binary, and
 * only when `@nestia/sdk` is actually resolvable from the project. A project
 * depending on `@nestia/core` alone never compiles any SDK transform code.
 */
export function createTtscPlugin(
  context: ITtscPluginFactoryContext,
): ITtscPlugin {
  const plugin: ITtscPlugin = {
    name: "@nestia/core",
    source: path.resolve(root(context), "native", "cmd", "ttsc-nestia"),
    composes: ["typia/lib/transform"],
  };
  const sdk: string | null = resolveSdkContributorSource(context);
  if (sdk !== null) plugin.contributors = [{ name: "sdk", source: sdk }];
  return plugin;
}
export default createTtscPlugin;

function root(context: ITtscPluginFactoryContext): string {
  return (
    resolvePackageRoot("@nestia/core/package.json", context.projectRoot) ??
    path.resolve(dirname, "..")
  );
}

function resolveSdkContributorSource(
  context: ITtscPluginFactoryContext,
): string | null {
  const manifest: string | null = resolvePackageRoot(
    "@nestia/sdk/package.json",
    context.projectRoot,
  );
  if (manifest === null) return null;
  const source: string = path.resolve(manifest, "native", "sdk");
  return fs.existsSync(source) ? source : null;
}

function resolvePackageRoot(
  packageJson: string,
  projectRoot: string,
): string | null {
  try {
    return path.dirname(
      require.resolve(packageJson, { paths: [dirname, projectRoot] }),
    );
  } catch {
    return null;
  }
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
