import fs from "fs";
import path from "path";

/**
 * Patches JavaScript emitted into a temporary directory so that it loads as
 * CommonJS.
 *
 * @evidence contracts/common.md#principled-implementation A compiler can keep `import.meta.url` in CommonJS output, and Node then detects the file as ESM before `require()` loads it, so the token is replaced by an expression that gives the same URL.
 * @evidence contracts/common.md#clear-and-simple-design One public function with a scanner that skips strings and comments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The patch changes only the temporary emit, and the scanner never rewrites text inside a string or a comment.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 */
export namespace EmittedJavaScriptPatcher {
  /**
   * Replaces every `import.meta.url` in the `.js` and `.cjs` files under a
   * directory with `require("url").pathToFileURL(__filename).href`.
   *
   * @evidence contracts/common.md#principled-implementation The token is replaced only at identifier boundaries and outside strings and comments, so the same file URL is produced under CommonJS as under ESM.
   * @evidence contracts/common.md#clear-and-simple-design One function over a file collector and a scanner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It patches only files that contain the token.
   * @evidence contracts/common.md#meaningful-documentation The comment states the replacement and the scope.
   */
  export const importMetaUrl = async (root: string): Promise<void> => {
    const files: string[] = await collect(root);
    await Promise.all(files.map(patch));
  };
}

const TARGET = "import.meta.url";
// TypeScript can preserve this token even in CommonJS output. Node 24 then
// syntax-detects the temporary `.js` file as ESM before require() can load it.
const REPLACEMENT = 'require("url").pathToFileURL(__filename).href';

const collect = async (location: string): Promise<string[]> => {
  const entries: fs.Dirent[] = await fs.promises.readdir(location, {
    withFileTypes: true,
  });
  const nested: string[][] = await Promise.all(
    entries.map(async (entry) => {
      const next: string = path.join(location, entry.name);
      if (entry.isDirectory()) return collect(next);
      if (entry.isFile() && /\.(?:cjs|js)$/i.test(entry.name)) return [next];
      return [];
    }),
  );
  return nested.flat();
};

const patch = async (file: string): Promise<void> => {
  const before: string = await fs.promises.readFile(file, "utf8");
  if (before.includes(TARGET) === false) return;

  const after: string = replaceImportMetaUrl(before);
  if (after !== before) await fs.promises.writeFile(file, after, "utf8");
};

const replaceImportMetaUrl = (input: string): string => {
  let output: string = "";
  let cursor: number = 0;
  for (let i = 0; i < input.length; ) {
    if (isTarget(input, i)) {
      output += input.slice(cursor, i);
      output += REPLACEMENT;
      i += TARGET.length;
      cursor = i;
      continue;
    }

    const ch: string = input[i]!;
    const next: string | undefined = input[i + 1];
    if (ch === '"' || ch === "'") i = skipQuoted(input, i, ch);
    else if (ch === "/" && next === "/") i = skipLineComment(input, i);
    else if (ch === "/" && next === "*") i = skipBlockComment(input, i);
    else ++i;
  }
  return output + input.slice(cursor);
};

const isTarget = (input: string, index: number): boolean =>
  input.startsWith(TARGET, index) &&
  isBoundary(input[index - 1]) &&
  isBoundary(input[index + TARGET.length]);

const isBoundary = (ch: string | undefined): boolean =>
  ch === undefined || /[^A-Za-z0-9_$]/.test(ch);

const skipQuoted = (input: string, index: number, quote: string): number => {
  let escaped: boolean = false;
  for (let i = index + 1; i < input.length; ++i) {
    const ch: string = input[i]!;
    if (escaped) escaped = false;
    else if (ch === "\\") escaped = true;
    else if (ch === quote) return i + 1;
  }
  return input.length;
};

const skipLineComment = (input: string, index: number): number => {
  const found: number = input.indexOf("\n", index + 2);
  return found === -1 ? input.length : found + 1;
};

const skipBlockComment = (input: string, index: number): number => {
  const found: number = input.indexOf("*/", index + 2);
  return found === -1 ? input.length : found + 2;
};
