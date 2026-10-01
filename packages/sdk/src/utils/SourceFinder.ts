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
   * @evidence contracts/common.md#principled-implementation A TypeScript file that exists is taken as it is, every other pattern is expanded, and the exclusion runs the same collection removing instead of adding.
   * @evidence contracts/common.md#clear-and-simple-design One function that runs the collection twice.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result follows the patterns and the filter.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const find = async (props: IProps): Promise<string[]> => {
    const dict: Set<string> = new Set();

    await emplace(props.filter)(props.include)((str) => dict.add(str));
    if (props.exclude?.length)
      await emplace(props.filter)(props.exclude)((str) => dict.delete(str));

    return [...dict];
  };

  const emplace =
    (filter: (file: string) => Promise<boolean>) =>
    (input: string[]) =>
    async (closure: (location: string) => void): Promise<void> => {
      for (const pattern of input) {
        if (_Is_file(pattern)) {
          closure(path.resolve(pattern));
          continue;
        }
        for (const file of await expand(pattern)) {
          const stats: fs.Stats = await fs.promises.stat(file);
          if (stats.isDirectory() === true)
            await iterate(filter)(closure)(file);
          else if (stats.isFile() && (await filter(file))) closure(file);
        }
      }
    };

  const iterate =
    (filter: (location: string) => Promise<boolean>) =>
    (closure: (location: string) => void) =>
    async (location: string): Promise<void> => {
      const directory: string[] = await fs.promises.readdir(location);
      for (const file of directory) {
        const next: string = path.resolve(`${location}/${file}`);
        const stats: fs.Stats = await fs.promises.stat(next);

        if (stats.isDirectory() === true) await iterate(filter)(closure)(next);
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

  const _Is_file = (pattern: string): boolean =>
    isTypeScriptSource(pattern) && fs.existsSync(pattern);

  /**
   * Reports whether a file is a TypeScript source: an extension of `ts`, `mts`,
   * or `cts` that is not a declaration file.
   *
   * @evidence contracts/common.md#principled-implementation The check is on the lower-cased name, and declaration files are excluded because they hold no runtime code.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is by extension.
   * @evidence contracts/common.md#meaningful-documentation The comment states the accepted extensions.
   */
  export const isTypeScriptSource = (file: string): boolean => {
    const lower: string = file.toLowerCase();
    return (
      /\.(?:[cm]?ts)$/.test(lower) &&
      /\.(?:d\.[cm]?ts|d\.ts)$/.test(lower) === false
    );
  };
}
