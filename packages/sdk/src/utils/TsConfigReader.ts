import fs from "fs";
import path from "path";

/**
 * Reads a tsconfig with its `extends` chain without the compiler API.
 *
 * Later bases override earlier bases, including shared ancestors. Circular
 * inheritance rejects rather than returning a partial configuration.
 *
 * @evidence contracts/common.md#principled-implementation The file is read as JSON with comments and trailing commas removed, each base is resolved and merged before the file itself, active ancestors reject cycles, and the relative `typeRoots` of each file are resolved against that file's own directory, as the compiler resolves them, before the merge forgets where they came from.
 * @evidence contracts/common.md#clear-and-simple-design One public function with private parsing and resolution helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It reads the files the compiler reads.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation Files are read as UTF-8 through `fs`, a leading byte order mark is dropped, relative bases and `typeRoots` are resolved with `path.resolve` against the directory of the file that names them, and package bases go through Node module resolution from that directory. Resolved native path spellings key the per-read cache and active-ancestor set. Relative bases and option paths retain the directory of the requested config rather than being rebased onto a symlink target.
 * efficient algorithms: Each distinct resolved configuration is parsed and merged once per read. Every extends edge contributes its already-merged options in declared order; work scales with input bytes, edges and the option records being combined rather than repeated traversal of shared ancestry.
 * reuse equivalent work: A read owns a cache of completed results keyed by resolved config pathname. It shares the same base across branches only within that read, and a later read observes edits rather than retaining stale configuration state.
 * bound retention and release resources: The active-ancestor set and completed-config map belong to one read. Active entries leave in finally, and the map is released when the returned read promise settles; no process-wide cache or open file handle survives.
 */
export namespace TsConfigReader {
  /**
   * A tsconfig: its `extends` and its compiler options.
   *
   * @evidence contracts/common.md#principled-implementation The record has the two members the loader reads.
   * @evidence contracts/common.md#clear-and-simple-design A two-member record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the members.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The record holds parsed option values and opens no path or process of its own.
   * efficient algorithms: The record represents config options and chooses no computation.
   * reuse equivalent work: The record coordinates no reads or reuse.
   * bound retention and release resources: The record owns no cache, task or filesystem handle.
   */
  export interface ITsConfig {
    extends?: string | string[];
    compilerOptions?: Record<string, any>;
  }

  /**
   * Returns the merged tsconfig of a file: bases first, later files override
   * earlier ones, and compiler options are merged by key. The `typeRoots` of a
   * file are returned absolute, resolved against the directory of the file that
   * wrote them.
   *
   * @evidence contracts/common.md#principled-implementation Relative bases are resolved from the file's directory and package bases through module resolution, a base that cannot be found is skipped, and completed base configurations are reused by resolved pathname, and only a revisit to an active ancestor is a rejected cycle. A shared base contributes its full inherited values to every branch, so later extends entries override earlier ones even in a diamond.
   * @evidence contracts/common.md#clear-and-simple-design One function delegating the merge.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The comment stripper and the trailing-comma remover are one-pass scanners that track strings, so a slash or a comma inside a string value is kept; the files are read as the compiler reads them, apart from the stated limit that only `typeRoots` is rebased and the other path-valued options keep their written form.
   * @evidence contracts/common.md#meaningful-documentation The comment states the merge order.
   * @evidence contracts/portability.md#os-neutral-implementation The `typeRoots` of the result are absolute native paths, but every other path-valued option keeps its written form relative to the directory of the file that wrote it, so a caller must not read such an option as relative to its own directory.
   * efficient algorithms: One per-read completed map avoids re-reading and recursively merging shared ancestors, while each direct base's option record is combined in order to preserve last-base precedence.
   * reuse equivalent work: Completed ancestors share their parsed and merged values within this request. Each call starts fresh state because files can change between generations.
   * bound retention and release resources: The call allocates its own ancestor set and result map and retains neither globally. Each recursive active entry is removed in finally, including parse and resolution failures.
   */
  export const read = async (file: string): Promise<ITsConfig> =>
    merge(file, new Set(), new Map());

  const merge = async (
    file: string,
    active: Set<string>,
    completed: Map<string, ITsConfig>,
  ): Promise<ITsConfig> => {
    const location: string = path.resolve(file);
    if (active.has(location))
      throw new Error(`Circular tsconfig extends: ${location}`);
    const cached: ITsConfig | undefined = completed.get(location);
    if (cached !== undefined) return cached;
    active.add(location);

    try {
      const current: ITsConfig = rebase(
        parse(await fs.promises.readFile(location, "utf8")),
        path.dirname(location),
      );
      const bases: ITsConfig[] = [];
      for (const parent of asArray(current.extends)) {
        const next: string | null = resolveExtends(
          parent,
          path.dirname(location),
        );
        if (next !== null) bases.push(await merge(next, active, completed));
      }
      const result = [...bases, current].reduce<ITsConfig>(
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
      completed.set(location, result);
      return result;
    } finally {
      active.delete(location);
    }
  };

  // The compiler reads a relative path of a config against the directory of the
  // file that wrote it, and the merged result no longer says which file that
  // was, so `typeRoots`, the one path-valued option a caller forwards to another
  // project, is made absolute here.
  const rebase = (config: ITsConfig, directory: string): ITsConfig => {
    const typeRoots: unknown = config.compilerOptions?.typeRoots;
    if (Array.isArray(typeRoots) === false) return config;
    return {
      ...config,
      compilerOptions: {
        ...config.compilerOptions,
        typeRoots: (typeRoots as unknown[]).map((root) =>
          typeof root === "string" ? path.resolve(directory, root) : root,
        ),
      },
    };
  };

  // A byte order mark, which editors on some platforms write, is no JSON.
  const parse = (text: string): ITsConfig =>
    JSON.parse(
      stripTrailingCommas(
        stripJsonComments(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text),
      ),
    ) as ITsConfig;

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

  // a comma followed, past whitespace, by a closing brace or bracket, outside
  // every string, so that the text of a value is never changed
  const stripTrailingCommas = (input: string): string => {
    let output = "";
    let string: false | '"' | "'" = false;
    let escaped = false;
    for (let i = 0; i < input.length; ++i) {
      const ch = input[i]!;
      if (string !== false) {
        output += ch;
        if (escaped) escaped = false;
        else if (ch === "\\") escaped = true;
        else if (ch === string) string = false;
      } else if (ch === '"' || ch === "'") {
        string = ch;
        output += ch;
      } else if (ch === ",") {
        let next = i + 1;
        while (next < input.length && /\s/.test(input[next]!)) ++next;
        if (input[next] !== "}" && input[next] !== "]") output += ch;
      } else output += ch;
    }
    return output;
  };
}
