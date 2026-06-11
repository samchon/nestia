import { pathToFileURL } from "url";

import { Creator } from "../../typings/Creator";
import { SourceFinder } from "../../utils/SourceFinder";

export const load_controllers = async (
  path: string | string[] | { include: string[]; exclude?: string[] },
  isTsNode?: boolean,
): Promise<Creator<object>[]> => {
  const include: string[] = Array.isArray(path)
    ? path
    : typeof path === "object"
      ? path.include
      : [path];
  const exclude: string[] =
    typeof path === "object" && !Array.isArray(path)
      ? (path.exclude ?? [])
      : [];
  const filter =
    isTsNode === true
      ? (file: string) =>
          file.substring(file.length - 3) === ".ts" &&
          file.substring(file.length - 5) !== ".d.ts"
      : (file: string) => file.substring(file.length - 3) === ".js";
  const sources: string[] = await SourceFinder.find({
    include,
    exclude,
    filter,
  });
  const controllers: Creator<object>[] = await mount(sources);
  if (controllers.length !== 0 || isTsNode === true) return controllers;

  // No compiled `.js` controllers were found. Under `ttsx`, the project runs
  // straight from its TypeScript sources: `__dirname` still points at the
  // source tree (the runtime hooks serve the emitted JS under the source
  // URLs), so the controllers on disk are `.ts`, not `.js`. Detect that
  // source-run context and retry with the TypeScript filter — `import()` of
  // each `.ts` file is then served as the transformed emit by the hooks.
  if (!isTsxRuntime()) return controllers;

  const tsFilter = (file: string) =>
    file.substring(file.length - 3) === ".ts" &&
    file.substring(file.length - 5) !== ".d.ts";
  const fallback: string[] = await SourceFinder.find({
    include,
    exclude,
    filter: tsFilter,
  });
  return fallback.length === 0 ? controllers : mount(fallback);
};

/** @internal */
async function mount(sources: string[]): Promise<any[]> {
  const controllers: any[] = [];
  for (const file of sources) {
    const external: any = await dynamicImport(pathToFileURL(file).href);
    for (const key in external) {
      const instance: Creator<object> = external[key];
      if (
        instance === null ||
        (typeof instance !== "function" && typeof instance !== "object")
      )
        continue;
      if (Reflect.getMetadata("path", instance) !== undefined)
        controllers.push(instance);
    }
  }
  return controllers;
}

const dynamicImport: (specifier: string) => Promise<any> = Function(
  "specifier",
  "return import(specifier);",
) as (specifier: string) => Promise<any>;

/**
 * Whether the process is running from TypeScript source under `ttsx`.
 *
 * `ttsx` runs a TypeScript entry from source: it builds the owning project to a
 * temporary directory and installs runtime module hooks that serve that emit
 * under the original source URLs, exporting the manifest path through
 * `TTSX_RUNTIME_MANIFEST`. Its presence is the reliable signal that the
 * controllers on disk are `.ts` (the `.js` glob will be empty) yet `import()`
 * of those `.ts` files resolves to transformed JavaScript.
 */
function isTsxRuntime(): boolean {
  return (
    typeof process.env.TTSX_RUNTIME_MANIFEST === "string" &&
    process.env.TTSX_RUNTIME_MANIFEST.length !== 0
  );
}
