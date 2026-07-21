import fs from "fs";
import path from "path";

export namespace TsConfigReader {
  export interface ITsConfig {
    extends?: string | string[];
    compilerOptions?: Record<string, any>;
  }

  export const read = async (file: string): Promise<ITsConfig> =>
    merge(file, new Set());

  const merge = async (
    file: string,
    visited: Set<string>,
  ): Promise<ITsConfig> => {
    const location: string = path.resolve(file);
    if (visited.has(location)) return {};
    visited.add(location);

    const current: ITsConfig = parse(
      await fs.promises.readFile(location, "utf8"),
    );
    const bases: ITsConfig[] = [];
    for (const parent of asArray(current.extends)) {
      const next: string | null = resolveExtends(
        parent,
        path.dirname(location),
      );
      if (next !== null) bases.push(await merge(next, visited));
    }
    return [...bases, current].reduce<ITsConfig>(
      (acc, elem) => ({
        ...acc,
        ...elem,
        compilerOptions: {
          ...(acc.compilerOptions ?? {}),
          ...(elem.compilerOptions ?? {}),
        },
      }),
      {},
    );
  };

  const parse = (text: string): ITsConfig =>
    JSON.parse(stripTrailingCommas(stripJsonComments(text))) as ITsConfig;

  const asArray = <T>(value: T | T[] | undefined): T[] =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

  const resolveExtends = (specifier: string, cwd: string): string | null => {
    const candidates = (base: string): string[] => {
      const ext: string = path.extname(base);
      return ext === ".json" || ext === ".jsonc"
        ? [base]
        : [base, `${base}.json`];
    };

    if (path.isAbsolute(specifier) || specifier.startsWith(".")) {
      for (const candidate of candidates(path.resolve(cwd, specifier)))
        if (fs.existsSync(candidate)) return candidate;
      return null;
    }

    for (const candidate of [
      specifier,
      ...candidates(specifier),
      path.join(specifier, "tsconfig.json"),
    ])
      try {
        return require.resolve(candidate, { paths: [cwd] });
      } catch {
        continue;
      }
    return null;
  };

  const stripJsonComments = (input: string): string => {
    let output = "";
    let string: false | '"' | "'" = false;
    let escaped = false;
    for (let i = 0; i < input.length; ++i) {
      const ch = input[i]!;
      const next = input[i + 1];
      if (string !== false) {
        output += ch;
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === string) string = false;
        continue;
      }
      if (ch === '"' || ch === "'") {
        string = ch;
        output += ch;
        continue;
      }
      if (ch === "/" && next === "/") {
        while (i < input.length && input[i] !== "\n") ++i;
        output += "\n";
        continue;
      }
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < input.length && !(input[i] === "*" && input[i + 1] === "/"))
          ++i;
        ++i;
        continue;
      }
      output += ch;
    }
    return output;
  };

  const stripTrailingCommas = (input: string): string =>
    input.replace(/,\s*([}\]])/g, "$1");
}
