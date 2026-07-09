import fs from "fs";
import path from "path";

/**
 * Detects which package manager owns a directory.
 *
 * Walks up from the given directory to the file-system root and returns the
 * manager of the first marker found on the way. An explicit `packageManager`
 * declaration in `package.json` wins over lockfiles at the same level, so a
 * project pinning e.g. `yarn@4` is respected even when a stray lockfile of
 * another manager remains. A nested project carrying its own
 * `package-lock.json` resolves to npm even inside an outer pnpm monorepo,
 * because installs must target the nearest project boundary. Without any marker
 * anywhere, npm is the fallback.
 */
export namespace PackageManagerDetector {
  export const MANAGERS = ["npm", "pnpm", "yarn"] as const;
  export type Manager = (typeof MANAGERS)[number];

  /**
   * Injectable file-system view, so unit tests can simulate marker layouts
   * without touching the real disk.
   */
  export interface IFileSystem {
    exists(location: string): boolean;
    read(location: string): string;
  }

  export const detect = (props: {
    directory: string;
    fs?: IFileSystem;
  }): Manager => {
    const view: IFileSystem = props.fs ?? REAL;
    let current: string = path.resolve(props.directory);
    while (true) {
      const found: Manager | undefined = at(view, current);
      if (found !== undefined) return found;
      const parent: string = path.dirname(current);
      if (parent === current) return "npm";
      current = parent;
    }
  };

  const at = (view: IFileSystem, directory: string): Manager | undefined => {
    const declared: Manager | undefined = declaration(view, directory);
    if (declared !== undefined) return declared;
    if (
      view.exists(path.join(directory, "pnpm-lock.yaml")) ||
      view.exists(path.join(directory, "pnpm-workspace.yaml"))
    )
      return "pnpm";
    if (view.exists(path.join(directory, "yarn.lock"))) return "yarn";
    if (view.exists(path.join(directory, "package-lock.json"))) return "npm";
    return undefined;
  };

  const declaration = (
    view: IFileSystem,
    directory: string,
  ): Manager | undefined => {
    const manifest: string = path.join(directory, "package.json");
    if (!view.exists(manifest)) return undefined;
    try {
      const value: unknown = JSON.parse(view.read(manifest)).packageManager;
      if (typeof value !== "string") return undefined;
      for (const manager of MANAGERS)
        if (value === manager || value.startsWith(`${manager}@`))
          return manager;
    } catch {}
    return undefined;
  };

  const REAL: IFileSystem = {
    exists: (location) => fs.existsSync(location),
    read: (location) => fs.readFileSync(location, "utf8"),
  };
}
