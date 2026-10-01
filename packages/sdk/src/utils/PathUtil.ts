import path from "path";
import { fileURLToPath } from "url";

/**
 * Helpers for route paths used as accessors, and for source file locations.
 *
 * @evidence contracts/common.md#principled-implementation The namespace turns a path into accessor names and a source location into a plain path.
 * @evidence contracts/common.md#clear-and-simple-design Two functions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts They are plain helpers.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace PathUtil {
  /**
   * Returns the accessor segments of a path: the segments that are not empty
   * and not parameters, with dashes and dots replaced by underscores.
   *
   * @evidence contracts/common.md#principled-implementation Parameters do not name a namespace and the replaced characters are not valid in an identifier.
   * @evidence contracts/common.md#clear-and-simple-design One pipeline.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The rule applies to every path.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const accessors = (path: string) =>
    path
      .split("/")
      .filter((str) => str.length && str[0] !== ":")
      .map(normalize);

  /**
   * Returns the plain path of a source location: a `file:` URL is decoded to
   * the path it names, with forward slashes, and any other text is returned as
   * it is.
   *
   * @evidence contracts/common.md#principled-implementation A file URL is percent-encoded, so a path with a space or a non-ASCII character reads back only through the URL decoder, and the platform separator is replaced so the result is the same on every platform.
   * @evidence contracts/common.md#clear-and-simple-design One conditional over the standard decoder.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only a `file:` location is decoded; a plain path is never altered.
   * @evidence contracts/common.md#meaningful-documentation The comment states both inputs and the separator.
   */
  export const location = (str: string): string =>
    str.startsWith("file:")
      ? fileURLToPath(str).split(path.sep).join("/")
      : str;

  const normalize = (str: string) =>
    str.split("-").join("_").split(".").join("_");
}
