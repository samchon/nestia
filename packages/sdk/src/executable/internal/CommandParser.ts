/**
 * Parses the command-line flags of the `nestia` command.
 *
 * @evidence contracts/common.md#principled-implementation The namespace reads `--key value` pairs from an argument list.
 * @evidence contracts/common.md#clear-and-simple-design One function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a plain parser.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation CommandParser parses supplied argument strings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace CommandParser {
  /**
   * Returns the `--key value` pairs of an argument list as an object; a flag
   * without a value, or followed by another flag, is left out.
   *
   * @evidence contracts/common.md#principled-implementation Each argument that starts with two dashes is a key, and the next argument is its value only when it exists and is not itself a flag.
   * @evidence contracts/common.md#clear-and-simple-design One loop.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It applies to every argument.
   * @evidence contracts/common.md#meaningful-documentation The comment states the omitted flags.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation CommandParser.parse parses supplied argument strings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export function parse(argList: string[]): Record<string, string> {
    const output: Record<string, string> = {};
    argList.forEach((arg, i) => {
      if (arg.startsWith("--") === false) return;

      const key = arg.slice(2);
      const value: string | undefined = argList[i + 1];
      if (value === undefined || value.startsWith("--")) return;

      output[key] = value;
    });
    return output;
  }
}
