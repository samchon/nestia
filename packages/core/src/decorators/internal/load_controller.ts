import is_ts_node from "detect-ts-node";
import path from "path";

import { Creator } from "../../typings/Creator";
import { SourceFinder } from "../../utils/SourceFinder";

export const load_controllers = async (
  path: string | string[] | { include: string[]; exclude?: string[] },
  isTsNode?: boolean,
): Promise<Creator<object>[]> => {
  const sources: string[] = await SourceFinder.find({
    include: Array.isArray(path)
      ? path
      : typeof path === "object"
        ? path.include
        : [path],
    exclude:
      typeof path === "object" && !Array.isArray(path)
        ? (path.exclude ?? [])
        : [],
    filter:
      isTsNode === true || EXTENSION === "ts"
        ? (file) =>
            file.substring(file.length - 3) === ".ts" &&
            file.substring(file.length - 5) !== ".d.ts"
        : (flle) => flle.substring(flle.length - 3) === ".js",
  });
  return mount(sources);
};

/** @internal */
async function mount(sources: string[]): Promise<any[]> {
  const controllers: any[] = [];
  for (const file of sources) {
    // POSIX relative specifier: works both as a native ESM dynamic import
    // (module: nodenext) and as a downleveled require() (module: commonjs).
    const external: any = await import(specifier(file));
    for (const key in external) {
      const instance: Creator<object> = external[key];
      if (Reflect.getMetadata("path", instance) !== undefined)
        controllers.push(instance);
    }
  }
  return controllers;
}

/** @internal */
const specifier = (location: string): string => {
  const relative: string = path
    .relative(__dirname, path.resolve(location))
    .split(path.sep)
    .join("/");
  return `./${relative}`;
};

/** @internal */
const EXTENSION = is_ts_node ? "ts" : "js";
