import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const CONFIG_FILES = new Set(["nestia.config.ts", "nestia.configuration.ts"]);

export async function resolve(specifier, context, nextResolve) {
  const url = specifier.startsWith("file:")
    ? specifier
    : context.parentURL === undefined
      ? pathToFileURL(path.resolve(specifier)).href
      : new URL(specifier, context.parentURL).href;
  if (url.startsWith("file:") && CONFIG_FILES.has(path.basename(fileURLToPath(url))))
    return { shortCircuit: true, url };
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && CONFIG_FILES.has(path.basename(fileURLToPath(url)))) {
    const filename = fileURLToPath(url);
    const source = await fs.readFile(filename, "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        verbatimModuleSyntax: false,
      },
      fileName: filename,
    });
    return {
      format: "commonjs",
      shortCircuit: true,
      source: output.outputText,
    };
  }
  return nextLoad(url, context);
}
