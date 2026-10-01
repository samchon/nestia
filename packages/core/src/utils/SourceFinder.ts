import fs from "fs";
import { glob } from "glob";
import path from "path";

/**
 * Finds source files by path, directory, or glob.
 *
 * @evidence contracts/common.md#principled-implementation The finder resolves each pattern to existing files or directories, walks directories, applies the caller's filter to files only, and subtracts the excluded set, so the result is the included files minus the excluded ones.
 * @evidence contracts/common.md#clear-and-simple-design One public function and private walkers; the caller supplies the filter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It contains no file names; extensions come from the caller's filter.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation The finder turns each pattern into an absolute native path with `path.resolve` and asks the filesystem itself, through `existsSync`, `stat` and `readdir`, whether a path exists and what it is, so the volume's own case policy and links apply. Only the part of a pattern below its longest existing ancestor is globbed, rewritten from the native separator to `/` because glob reads a Windows backslash as an escape. Remaining assumptions: the case policy of wildcard matching is glob's own platform default and not a probe of the volume, accepted files are keyed by filesystem real path while returned locations retain their discovered spelling, and directory links are followed once per real path in each include or exclude collection, so aliases and cycles do not repeat a traversal.
 */
export namespace SourceFinder {
  /**
   * Returns the files matched by the include patterns and not by the exclude
   * patterns.
   *
   * A pattern may name a file, a directory that is walked recursively, or a
   * glob. Only files accepted by the filter are returned.
   *
   * @evidence contracts/common.md#principled-implementation A pattern that exists on disk is used as a path; otherwise its longest existing ancestor becomes the base of a glob search, so a pattern with wildcards is matched below the part of the path that exists, and a base that does not exist matches nothing; accepted file identities use filesystem real paths, so includes and exclusions agree across links and case aliases while output retains a discovered native spelling.
   * @evidence contracts/common.md#clear-and-simple-design One function that runs the same collection twice, once adding and once removing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The result follows the patterns and the filter, with no fixed directory.
   * @evidence contracts/common.md#meaningful-documentation The comment states the pattern forms and the filtering.
   * @evidence contracts/portability.md#os-neutral-implementation An existing path is used literally, so no character glob reads specially is interpreted. Otherwise the nearest existing ancestor, found with `existsSync` and `dirname` until the filesystem root, is the glob's working directory and the matches are resolved against it, so a drive letter or a UNC root never enters the pattern.
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
    (filter: (file: string) => boolean) =>
    (input: string[]) =>
    async (closure: (location: string) => void): Promise<void> => {
      const visited: Set<string> = new Set();
      for (const pattern of input) {
        for (const file of await _Glob(pattern)) {
          const stats: fs.Stats = await fs.promises.stat(file);
          if (stats.isDirectory() === true)
            await iterate(filter)(closure)(file, visited);
          else if (stats.isFile() && filter(file)) closure(file);
        }
      }
    };

  const iterate =
    (filter: (location: string) => boolean) =>
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
        else if (stats.isFile() && filter(next)) closure(next);
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
   */
  const _Glob = async (pattern: string): Promise<string[]> => {
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
}

interface IProps {
  exclude?: string[];
  include: string[];
  filter: (location: string) => boolean;
}
