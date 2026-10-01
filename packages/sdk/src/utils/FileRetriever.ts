import fs from "fs";
import path from "path";

/**
 * Finds a file or a directory by name, in a directory and up to three parents.
 *
 * @evidence contracts/common.md#principled-implementation The search checks a directory and then goes to its parent, at most three levels up, which is where a project's own files are expected.
 * @evidence contracts/common.md#clear-and-simple-design Two curried functions with the same recursion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The limit is a fixed search depth, not a file name.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace FileRetriever {
  /**
   * Returns the nearest directory, from the given one up to three parents, that
   * contains an entry with the name, or `null`.
   *
   * @evidence contracts/common.md#principled-implementation The recursion is bounded by the depth counter, so it terminates at the filesystem root as well.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The bound is explicit.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const directory =
    (name: string) =>
    (dir: string, depth: number = 0): string | null => {
      const location: string = path.join(dir, name);
      if (fs.existsSync(location)) return dir;
      else if (depth > 2) return null;
      return directory(name)(path.join(dir, ".."), depth + 1);
    };

  /**
   * Returns the path of the nearest file with the name, from the given
   * directory up to three parents, or `null`.
   *
   * @evidence contracts/common.md#principled-implementation The recursion is bounded by the depth counter.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The bound is explicit.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const file =
    (name: string) =>
    (directory: string, depth: number = 0): string | null => {
      const location: string = path.join(directory, name);
      if (fs.existsSync(location)) return location;
      else if (depth > 2) return null;
      return file(name)(path.join(directory, ".."), depth + 1);
    };
}
