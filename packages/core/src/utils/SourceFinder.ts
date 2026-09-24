import fs from "fs";
import { glob } from "glob";
import path from "path";

export namespace SourceFinder {
  export const find = async (props: IProps): Promise<string[]> => {
    const dict: Set<string> = new Set();

    await emplace(props.filter)(props.include)((str) => dict.add(str));
    if (props.exclude?.length)
      await emplace(props.filter)(props.exclude)((str) => dict.delete(str));

    return [...dict];
  };

  const emplace =
    (filter: (file: string) => boolean) =>
    (input: string[]) =>
    async (closure: (location: string) => void): Promise<void> => {
      for (const pattern of input) {
        for (const file of await _Glob(pattern)) {
          const stats: fs.Stats = await fs.promises.stat(file);
          if (stats.isDirectory() === true)
            await iterate(filter)(closure)(file);
          else if (stats.isFile() && filter(file)) closure(file);
        }
      }
    };

  const iterate =
    (filter: (location: string) => boolean) =>
    (closure: (location: string) => void) =>
    async (location: string): Promise<void> => {
      const directory: string[] = await fs.promises.readdir(location);
      for (const file of directory) {
        const next: string = path.resolve(`${location}/${file}`);
        const stats: fs.Stats = await fs.promises.stat(next);

        if (stats.isDirectory() === true) await iterate(filter)(closure)(next);
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
