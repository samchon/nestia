import fs from "fs";
import path from "path";

/**
 * Read the `typescript` catalog of the repository's `pnpm-workspace.yaml`,
 * resolving the YAML anchors it uses to share one version across the ttsc
 * packages (`ttsc: &ttsc ^0.34.1` followed by `'@ttsc/unplugin': *ttsc`).
 *
 * Parsing only this one block keeps the test free of a YAML dependency the test
 * workspace does not declare, and the shape is stable: the catalog is a flat
 * map of name to specifier.
 *
 * @evidence contracts/common.md#principled-implementation The flat declared TypeScript catalog supplies an oracle independent of the bundler's lockfile input. Anchor declarations and following aliases resolve in source order, preserving exact specifiers rather than imposing a range policy.
 * @evidence contracts/common.md#clear-and-simple-design One shared reader serves both generated-project tests and keeps catalog parsing out of their assertions. It reads only the declared flat block and returns its name/specifier map.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The reader interprets authored catalog input without patching a generator or deriving expected values from generated output. No compiler line, fixture name or expected version is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment describes anchor handling, the independent declaration oracle and the flat-map premise; callers retain their own generated-artifact assertions.
 * @evidence contracts/portability.md#os-neutral-implementation node:path resolves the repository declaration from the test workspace cwd, which canonical pnpm unit commands select on Windows and POSIX. No shell path or filesystem case policy is invented.
 */
export const readTypeScriptCatalog = (): Record<string, string> => {
  const content: string = fs.readFileSync(
    path.resolve(process.cwd(), "../../pnpm-workspace.yaml"),
    "utf8",
  );
  const lines: string[] = content.split(/\r?\n/);
  const start: number = lines.findIndex((line) => line === "  typescript:");
  if (start < 0)
    throw new Error("pnpm-workspace.yaml has no `typescript` catalog.");

  const output: Record<string, string> = {};
  const anchors: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (/^\s*$/.test(line)) continue;
    if (line.startsWith("    ") === false) break;
    const match: RegExpMatchArray | null = line.match(
      /^ {4}(?:'([^']+)'|"([^"]+)"|([^:\s]+)): (?:&(\S+) )?(\S+)$/,
    );
    if (match === null) continue;
    const name: string = match[1] ?? match[2] ?? match[3]!;
    const anchor: string | undefined = match[4];
    const raw: string = match[5]!;
    const value: string = raw.startsWith("*") ? anchors[raw.slice(1)]! : raw;
    if (anchor !== undefined) anchors[anchor] = value;
    output[name] = value;
  }
  return output;
};
