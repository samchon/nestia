import is_ts_node from "detect-ts-node";
import fs from "fs";
import path from "path";

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
    typeof path === "object" && !Array.isArray(path) ? (path.exclude ?? []) : [];
  const filter =
    isTsNode === true || EXTENSION === "ts"
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
  if (controllers.length !== 0 || isTsNode === true || EXTENSION === "ts")
    return controllers;

  const runtimeRoot: string | null = findTtsxRuntimeRoot();
  if (runtimeRoot === null) return controllers;

  const fallback: string[] = await SourceFinder.find({
    include: include.map((p) => resolveRuntimePattern(runtimeRoot, p)),
    exclude: exclude.map((p) => resolveRuntimePattern(runtimeRoot, p)),
    filter,
  });
  return fallback.length === 0 ? controllers : mount(fallback);
};

/** @internal */
async function mount(sources: string[]): Promise<any[]> {
  const controllers: any[] = [];
  for (const file of sources) {
    const external: any = await import(file);
    for (const key in external) {
      const instance: Creator<object> = external[key];
      if (Reflect.getMetadata("path", instance) !== undefined)
        controllers.push(instance);
    }
  }
  return controllers;
}

/** @internal */
const EXTENSION = is_ts_node ? "ts" : "js";

function findTtsxRuntimeRoot(): string | null {
  const entry: string | undefined = process.argv[1];
  if (entry === undefined) return null;

  let current: string = path.resolve(entry);
  if (fs.existsSync(current) && fs.statSync(current).isFile())
    current = path.dirname(current);
  while (true) {
    if (fs.existsSync(path.join(current, ".ttsx.tsconfig.json")))
      return current;
    const parent: string = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function resolveRuntimePattern(runtimeRoot: string, pattern: string): string {
  if (path.isAbsolute(pattern)) return pattern;
  return path.resolve(runtimeRoot, pattern);
}
