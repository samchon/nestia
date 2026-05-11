import type { ITypiaContext } from "@typia/core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ITtscPlugin, ITtscPluginFactoryContext } from "ttsc";
import ts from "typescript";

import type { INestiaTransformOptions } from "./options/INestiaTransformOptions";
import { FileTransformer } from "./transformers/FileTransformer";

const filename: string = currentFilename();
const dirname: string = path.dirname(filename);

export function createTtscPlugin(
  context: ITtscPluginFactoryContext,
): ITtscPlugin {
  const root: string =
    resolvePackageRoot("@nestia/core/package.json", context.projectRoot) ??
    inferPackageRoot();
  return {
    name: "@nestia/core",
    source: path.resolve(root, "native", "cmd", "ttsc-nestia"),
    composes: [
      "typia",
      "typia/lib/transform",
      "@nestia/core",
      "@nestia/core/lib/transform",
      "@nestia/core/native/transform.cjs",
      "@nestia/sdk",
      "@nestia/sdk/lib/transform",
    ],
  };
}

export const transform = (
  program: ts.Program,
  options: INestiaTransformOptions | undefined,
  extras: ITypiaContext["extras"],
): ts.TransformerFactory<ts.SourceFile> => {
  const compilerOptions: ts.CompilerOptions = program.getCompilerOptions();
  const strict: boolean =
    compilerOptions.strictNullChecks !== undefined
      ? !!compilerOptions.strictNullChecks
      : !!compilerOptions.strict;
  if (strict === false)
    extras.addDiagnostic({
      category: ts.DiagnosticCategory.Error,
      code: "(@nestia/core)" as any,
      file: undefined,
      start: undefined,
      length: undefined,
      messageText: "strict mode is required.",
    });
  return FileTransformer.transform({
    program,
    compilerOptions,
    checker: program.getTypeChecker(),
    printer: ts.createPrinter(),
    options: options ?? {},
    extras,
  });
};
export default transform;

function resolvePackageRoot(
  packageJson: string,
  projectRoot: string,
): string | null {
  try {
    return path.dirname(require.resolve(packageJson, { paths: [projectRoot] }));
  } catch {
    return null;
  }
}

function inferPackageRoot(): string {
  return path.resolve(dirname, "..");
}

function currentFilename(): string {
  if (
    typeof __filename === "string" &&
    __filename !== "[stdin]" &&
    __filename.length !== 0
  )
    return normalizeFilename(__filename);

  const line: string | undefined = new Error().stack
    ?.split("\n")
    .find(
      (entry) =>
        entry.includes("/src/transform.ts") ||
        entry.includes("/lib/transform.js") ||
        entry.includes("/lib/transform.mjs"),
    );
  const matched: RegExpMatchArray | null | undefined = line?.match(
    /\(([^()]+):\d+:\d+\)|at ([^\s()]+):\d+:\d+/,
  );
  const fallback: string = typeof __filename === "string" ? __filename : "";
  return normalizeFilename(matched?.[1] ?? matched?.[2] ?? fallback);
}

function normalizeFilename(value: string): string {
  if (value.startsWith("file:")) return fileURLToPath(value);
  return value;
}
