import fs from "fs";
import path from "path";
import { TtscCompiler } from "ttsc";

/**
 * Compiles all generated migration cases in one source program.
 *
 * Each copied case keeps its own module tree. Package self-imports are rebased
 * to that case's authored source entry, so keyword and positional ABIs never
 * resolve to another case's package with the same name. The generated originals
 * remain available for diagnosis and template-specific checks.
 *
 * @evidence contracts/common.md#principled-implementation Each package import is resolved from that generated case's own package name and API source directory. A single public TtscCompiler request checks and emits all source and test closures together; failed compiler buffers are never written as runnable outputs.
 * @evidence contracts/common.md#clear-and-simple-design One operation copies generated trees, rebases their package imports, compiles the common program and materializes successful outputs. Recursive copying and source traversal are private to this preparation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No resolver, host or global is replaced. Only owned fixture copies change module spelling; package APIs and generated originals remain intact.
 * @evidence contracts/common.md#meaningful-documentation The comment explains source-tree isolation, ABI identity and retention of original artifacts; the returned directory owns the emitted copied tree.
 * @evidence contracts/portability.md#os-neutral-implementation Native join/relative/resolve operations handle filesystem identity; import specifiers alone use forward slashes. Output containment is checked before writing and no platform shell or symlink is needed.
 * @evidence contracts/performance.md#efficient-algorithms Source copying and import rebasing each visit a file once; one compiler request analyzes the full program instead of reopening the toolchain for every generated project.
 * @evidence contracts/performance.md#reuse-equivalent-work The generated variants share target, library and strict NodeNext semantics while retaining separate module trees. Decorator metadata and declaration emission apply to their union; keyword/positional signatures remain independent inputs within the program rather than repeated compiler contexts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the generated root, copied source tree and emitted tree until the next integration invocation. Compiler results are local to this call; no compiler host, backend or worker remains running.
 */
export const compileMigrationPrograms = (
  directories: string[],
  cacheDir: string,
): string => {
  if (directories.length === 0)
    throw new Error("No generated migration programs to compile.");
  const parent = path.dirname(directories[0]!);
  const cwd = fs.mkdtempSync(path.join(parent, "combined-"));
  const source = path.join(cwd, "source");
  const output = path.join(cwd, "lib");
  const include: string[] = [];
  for (const directory of directories) {
    if (path.dirname(directory) !== parent)
      throw new Error("Generated migration programs must share their owner.");
    const destination = path.join(source, path.basename(directory));
    fs.cpSync(directory, destination, {
      recursive: true,
      filter: (file) =>
        !["node_modules", "lib", "bin", ".git"].includes(path.basename(file)),
    });
    const api = fs.existsSync(path.join(destination, "packages/api"))
      ? path.join(destination, "packages/api")
      : destination;
    const roots =
      api === destination
        ? ["src", "test"]
        : ["packages/api/src", "packages/backend/src", "packages/backend/test"];
    for (const root of roots)
      include.push(`source/${path.basename(directory)}/${root}/**/*.ts`);
    const name: string = JSON.parse(
      fs.readFileSync(path.join(api, "package.json"), "utf8"),
    ).name;
    const visit = (location: string): void => {
      for (const entry of fs.readdirSync(location, { withFileTypes: true })) {
        const file = path.join(location, entry.name);
        if (entry.isDirectory()) visit(file);
        else if (entry.name.endsWith(".ts")) {
          const text = fs.readFileSync(file, "utf8");
          const replaced = text.replace(
            /\b(from\s+|(?:import|require)\s*\(\s*)(["'])([^"'\r\n]+)\2/g,
            (literal, prefix, quote, specifier) => {
              if (specifier !== name && !specifier.startsWith(name + "/lib/"))
                return literal;
              const target =
                specifier === name
                  ? path.join(api, "src/index")
                  : path.join(
                      api,
                      "src",
                      specifier.substring((name + "/lib/").length),
                    );
              let relative = path
                .relative(path.dirname(file), target)
                .split(path.sep)
                .join("/");
              if (!relative.startsWith(".")) relative = "./" + relative;
              return prefix + quote + relative + quote;
            },
          );
          if (replaced !== text) fs.writeFileSync(file, replaced);
        }
      }
    };
    visit(destination);
  }
  fs.writeFileSync(
    path.join(cwd, "tsconfig.json"),
    JSON.stringify(
      {
        extends: path.resolve(__dirname, "../../../config/tsconfig.json"),
        compilerOptions: {
          noEmit: false,
          noUnusedLocals: false,
          noUnusedParameters: false,
          declaration: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          resolveJsonModule: true,
          rootDir: "source",
          outDir: "lib",
          paths: {},
          plugins: [{ transform: "@nestia/core/native/transform.cjs" }],
        },
        include,
      },
      null,
      2,
    ),
  );
  const result = new TtscCompiler({
    cwd,
    tsconfig: "tsconfig.json",
    cacheDir,
  }).compile();
  if (result.type === "exception") throw result.error;
  if (result.type !== "success")
    throw new Error(JSON.stringify(result.diagnostics, null, 2));
  if (Object.keys(result.output).length === 0)
    throw new Error("Combined migration program emitted no files.");
  for (const [file, text] of Object.entries(result.output)) {
    const destination = path.resolve(cwd, file);
    const relative = path.relative(output, destination);
    if (
      !relative ||
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      throw new Error(`Migration compiler output escapes its owner: ${file}`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, text);
  }
  return output;
};
