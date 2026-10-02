import { pathToFileURL } from "url";

import { Creator } from "../../typings/Creator";
import { SourceFinder } from "../../utils/SourceFinder";

/**
 * Finds and imports the controllers under the given paths.
 *
 * A path, a list, or include and exclude lists are matched with globs, imported
 * by file URL, and every export that carries Nest's `path` metadata is a
 * controller. When no compiled `.js` controller is found and the process runs
 * from source under `ttsx`, the TypeScript files are used instead.
 *
 * @evidence contracts/common.md#principled-implementation Files are selected by a filter chosen from the runtime (JavaScript modules, or TypeScript sources without declaration files), each is imported by `file:` URL through a native dynamic import that survives CommonJS downleveling, and a controller is recognized by Nest's own `path` metadata, so no naming convention is assumed.
 * @evidence contracts/common.md#clear-and-simple-design One function with the fallback for the source-run case inside it and the filters and the mount loop as private helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Discovery follows the metadata Nest itself writes; the `ttsx` fallback is decided by the runtime's own environment variable, not by a project name.
 * @evidence contracts/common.md#meaningful-documentation The comment states the path forms, the recognition rule, and the source-run fallback.
 * @evidence contracts/portability.md#os-neutral-implementation SourceFinder returns native absolute file paths and pathToFileURL converts them to escaped file URLs before dynamic import, including drive letters, spaces and URL punctuation. Extension matching selects source formats rather than defining filesystem identity.
 */
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
  const filter = isTsNode === true ? isTypeScriptSource : isJavaScriptModule;
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
  // source-run context and retry with the TypeScript filter; `import()` of each
  // `.ts` file is then served as the transformed emit by the hooks.
  if (!isTsxRuntime()) return controllers;

  const fallback: string[] = await SourceFinder.find({
    include,
    exclude,
    filter: isTypeScriptSource,
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

const isJavaScriptModule = (file: string): boolean =>
  /\.(?:[cm]?js)$/.test(file.toLowerCase());

const isTypeScriptSource = (file: string): boolean => {
  const lower: string = file.toLowerCase();
  return (
    /\.(?:[cm]?ts)$/.test(lower) &&
    /\.(?:d\.[cm]?ts|d\.ts)$/.test(lower) === false
  );
};
