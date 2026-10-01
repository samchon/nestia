import fs from "fs";
import { glob } from "glob";
import path from "path";

/**
 * Finds source files by path, directory, or glob.
 *
 * @evidence contracts/common.md#principled-implementation Each pattern is resolved to files or directories, directories are walked, the filter is applied to files, and the excluded set is subtracted.
 * @evidence contracts/common.md#clear-and-simple-design Three public functions and private walkers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The filter is the caller's.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation The finder turns each pattern into an absolute native path with `path.resolve` and asks the filesystem itself, through `existsSync`, `stat` and `readdir`, whether a path exists and what it is, so the volume's own case policy and links apply. Only the part of a pattern below its longest existing ancestor is globbed, rewritten from the native separator to `/` because glob reads a Windows backslash as an escape. Remaining assumptions: the case policy of wildcard matching is glob's own platform default and not a probe of the volume, and accepted files are keyed by filesystem real path while returned locations retain their discovered spelling, so include and exclude aliases identify the same file.
 */
export namespace SourceFinder {
  interface IProps {
    exclude?: string[];
    include: string[];
    filter: (location: string) => Promise<boolean>;
  }

  /**
   * Returns the files matched by the include patterns and not by the exclude
   * patterns and accepted by the filter.
   *
   * @evidence contracts/common.md#principled-implementation Every pattern is expanded, existing paths remain literal, and only regular files accepted by the filter enter either collection; the exclusion runs the same collection removing instead of adding.
   * @evidence contracts/common.md#clear-and-simple-design One function that runs the collection twice.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result follows the patterns and the filter.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   * @evidence contracts/portability.md#os-neutral-implementation It composes the include and exclude collections over native absolute paths and returns them as `path.resolve` spelled them. A directory is walked through `stat`, which follows links; each include or exclude collection keeps a real-path set, so a linked directory is entered once and a link back to an ancestor is skipped.
   */
  export const find = async (props: IProps): Promise<string[]> => {
    const dict: Map<string, string> = new Map();

    await emplace(props.filter)(props.include)((str) =>
      dict.set(fs.realpathSync.native(str), str),
    );
    if (props.exclude?.length)
      await emplace(props.filter)(props.exclude)((str) =>
        dict.delete(fs.realpathSync.native(str)),
      );

    return [...dict.values()];
  };

  const emplace =
    (filter: (file: string) => Promise<boolean>) =>
    (input: string[]) =>
    async (closure: (location: string) => void): Promise<void> => {
      const visited: Set<string> = new Set();
      for (const pattern of input) {
        for (const file of await expand(pattern)) {
          const stats: fs.Stats = await fs.promises.stat(file);
          if (stats.isDirectory() === true)
            await iterate(filter)(closure)(file, visited);
          else if (stats.isFile() && (await filter(file))) closure(file);
        }
      }
    };

  const iterate =
    (filter: (location: string) => Promise<boolean>) =>
    (closure: (location: string) => void) =>
    async (location: string, visited: Set<string>): Promise<void> => {
      const identity: string = await fs.promises.realpath(location);
      if (visited.has(identity)) return;
      visited.add(identity);
      const directory: string[] = await fs.promises.readdir(location);
      for (const file of directory) {
        const next: string = path.resolve(`${location}/${file}`);
        const stats: fs.Stats = await fs.promises.stat(next);

        if (stats.isDirectory() === true)
          await iterate(filter)(closure)(next, visited);
        else if (stats.isFile() && (await filter(next))) closure(next);
      }
    };

  /**
   * Files and directories a path or glob pattern names.
   *
   * An existing path is taken literally, whatever characters it holds, as a
   * directory such as `app [v2]` would otherwise read as a character class. For
   * a pattern, the longest existing ancestor is the literal base and only the
   * rest is globbed, with `/` separators, since glob reads a Windows backslash
   * as an escape.
   *
   * @evidence contracts/common.md#principled-implementation The wildcard part is matched below the part of the path that exists, and a base that does not exist matches nothing.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It follows the filesystem.
   * @evidence contracts/common.md#meaningful-documentation The comment states the two cases.
   * @evidence contracts/portability.md#os-neutral-implementation An existing path is used literally, so no character glob reads specially is interpreted. Otherwise the nearest existing ancestor, found with `existsSync` and `dirname` until the filesystem root, is the glob's working directory, the remainder is rewritten from `path.sep` to `/`, and the matches are resolved against that base, so a drive letter or a UNC root never enters the pattern.
   */
  export const expand = async (pattern: string): Promise<string[]> => {
    const absolute: string = path.resolve(pattern);
    if (fs.existsSync(absolute)) return [absolute];
    let base: string = absolute;
    while (fs.existsSync(base) === false) {
      const parent: string = path.dirname(base);
      if (parent === base) return [];
      base = parent;
    }
    const rest: string = path
      .relative(base, absolute)
      .split(path.sep)
      .join("/");
    const matches: string[] = await glob(rest, { cwd: base });
    return matches.map((str) => path.resolve(base, str));
  };

  /**
   * Reports whether a file is a TypeScript source: an extension of `ts`, `mts`,
   * or `cts` that is not a declaration file.
   *
   * @evidence contracts/common.md#principled-implementation The check is on the lower-cased name, and declaration files are excluded because they hold no runtime code.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is by extension.
   * @evidence contracts/common.md#meaningful-documentation The comment states the accepted extensions.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation The function judges the spelling of a name the caller supplies and opens no path, so it owns no filesystem or process decision; extensions are compared lower-cased on every platform by design.
   */
  export const isTypeScriptSource = (file: string): boolean => {
    const lower: string = file.toLowerCase();
    return (
      /\.(?:[cm]?ts)$/.test(lower) &&
      /\.(?:d\.[cm]?ts|d\.ts)$/.test(lower) === false
    );
  };
}
