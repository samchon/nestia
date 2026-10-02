import { parse } from "@babel/parser";
import fs from "fs";
import path from "path";

/**
 * Patches JavaScript emitted into a temporary directory so that it loads as
 * CommonJS.
 *
 * @evidence contracts/common.md#principled-implementation A compiler can keep `import.meta.url` in CommonJS output, and Node then detects the file as ESM before `require()` loads it, so the token is replaced by an expression that gives the same URL.
 * @evidence contracts/common.md#clear-and-simple-design One public function collects emitted files and a JavaScript parser identifies import.meta.url expressions by their syntax nodes; source slices retain all unrelated text.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The patch changes only the temporary emit. The parser reads JavaScript grammar, so regular expressions after control-flow statements and property names resembling import.meta.url remain untouched; no previous-token approximation substitutes for parsing.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidence contracts/portability.md#os-neutral-implementation Entries are listed with `readdir` and joined with `path.join`; only regular `.js` and `.cjs` files, named case-insensitively, are read and rewritten as UTF-8, and symbolic links and other entry kinds are left alone. The replacement derives the file URL with `url.pathToFileURL(__filename)`, the platform's own conversion, so drive letters, UNC paths and percent-encoding follow the rules of `import.meta.url`. The text outside the token, line endings included, is preserved.
 */
export namespace EmittedJavaScriptPatcher {
  /**
   * Replaces every `import.meta.url` in the `.js` and `.cjs` files under a
   * directory with `require("url").pathToFileURL(__filename).href`.
   *
   * @evidence contracts/common.md#principled-implementation The parser selects only a non-computed url property whose object is the import.meta meta-property, including spaced expressions and template substitutions. Literal and comment text is never an expression node, and the replacement derives the executing CommonJS file URL.
   * @evidence contracts/common.md#clear-and-simple-design One function collects files and delegates expression detection to the JavaScript grammar parser.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It patches only files that contain the token.
   * @evidence contracts/common.md#meaningful-documentation The comment states the replacement and the scope.
   * @evidence contracts/portability.md#os-neutral-implementation Files are read and rewritten concurrently without locking, one pending operation per file, so the caller must be the only writer of the directory, as it is for its own temporary emit.
   */
  export const importMetaUrl = async (root: string): Promise<void> => {
    const files: string[] = await collect(root);
    await Promise.all(files.map(patch));
  };
}

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
  if (before.includes("import") === false) return;

  const after: string = replaceImportMetaUrl(before);
  if (after !== before) await fs.promises.writeFile(file, after, "utf8");
};

// Parse module expressions without imposing module strictness: TypeScript may preserve
// import.meta in otherwise CommonJS output. Top-level return is valid inside
// Node's CommonJS wrapper. The parser, rather than token context guesses, owns
// the distinction between regular expressions, divisions and property names.
const replaceImportMetaUrl = (input: string): string => {
  const root = parse(input, {
    sourceType: "module",
    strictMode: false,
    attachComment: false,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
  });
  const spans: Array<{ start: number; end: number }> = [];
  const pending: Array<{
    type: string;
    start?: number | null;
    end?: number | null;
  }> = [root];
  while (pending.length !== 0) {
    const node = pending.pop()! as Record<string, any>;
    if (
      node.type === "MemberExpression" &&
      node.computed === false &&
      node.property?.type === "Identifier" &&
      node.property.name === "url" &&
      node.object?.type === "MetaProperty" &&
      node.object.meta.name === "import" &&
      node.object.property.name === "meta"
    )
      spans.push({ start: node.start, end: node.end });
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value)
          if (child && typeof child.type === "string") pending.push(child);
      } else if (
        value &&
        typeof value === "object" &&
        typeof value.type === "string"
      )
        pending.push(value);
    }
  }
  spans.sort((a, b) => a.start - b.start);
  const pieces: string[] = [];
  let cursor = 0;
  for (const span of spans) {
    pieces.push(input.slice(cursor, span.start), REPLACEMENT);
    cursor = span.end;
  }
  pieces.push(input.slice(cursor));
  return pieces.join("");
};
