import fs from "fs";
import path from "path";

export namespace EmittedJavaScriptPatcher {
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
