import cp from "child_process";
import fs from "fs";
import path from "path";
import { TtscCompiler } from "ttsc";

import { TsConfigReader } from "../../../../packages/sdk/lib/utils/TsConfigReader";

/**
 * Compiles original generated migration projects in one source program.
 *
 * Inheritance is checked before TypeScript's showConfig resolves the original
 * options and source populations. Generated self-references and exports are
 * retained; callers give variants distinct package names. Only output location
 * and compatible checking/emission flags are shared. No source is rewritten.
 *
 * @evidence contracts/common.md#principled-implementation The built JSONC reader and explicit base resolution reject missing/cyclic inheritance that showConfig alone ignores. TypeScript resolves actual options and selected files; configured roots contain them. Plain Node checks API exports, and the native compiler resolves original self-imports from unique package identities. One successful result emits their union without rewriting sources.
 * @evidence contracts/common.md#clear-and-simple-design One operation resolves original projects, prepares their workspace links and compiles their union. Configuration parsing is language preparation without plugin discovery; the only composed producer request is the final compile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generated source, exports and project files stay unchanged. Plain resolver/config-parser children clear inherited NODE_OPTIONS because ttsx adds loader preloads; ordinary Node/TypeScript interpretation must remain observable. No resolver, host or global is replaced, and malformed inputs fail before emission.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies original settings and package identities as inputs, shared compiler flags as compatibility assumptions, and actual phase counts rather than disguising per-project compilation.
 * @evidence contracts/portability.md#os-neutral-implementation Native path operations establish source/output containment; a Node launcher avoids platform command shims. Generated Nest workspace links use Node junction/symlink support and are checked against the actual API root if already present.
 * @evidence contracts/performance.md#efficient-algorithms Each original project receives one configuration-only CLI parse without type analysis or plugin build; a completed-path set bounds the explicit inheritance walk, while the owning JSONC reader reparses its bases per read. Source filenames deduplicate with a Set, and one compiler request checks their complete closure instead of twelve repeated analyses.
 * @evidence contracts/performance.md#reuse-equivalent-work The original variants share strict NodeNext, target and library semantics; per-project compatible stricter checks and decorator/declaration emission apply to their union. Incompatible semantic compiler settings reject rather than silently sharing a changed premise. Unique package names preserve keyword/positional ABIs within one program.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns originals, generated workspace links and unique emitted output until the next integration invocation. Synchronous language-parser processes and the compiler finish before return; failed buffers never become runnable outputs.
 */
export const compileMigrationPrograms = async (
  directories: string[],
  cacheDir: string,
): Promise<string> => {
  if (directories.length === 0)
    throw new Error("No generated migration programs to compile.");
  const parent = path.dirname(directories[0]!);
  const cwd = fs.mkdtempSync(path.join(parent, "combined-"));
  const output = path.join(cwd, "lib");
  const files = new Set<string>();
  const names = new Set<string>();
  const tscPackage = require.resolve("typescript/package.json");
  const tsc = path.resolve(
    path.dirname(tscPackage),
    JSON.parse(fs.readFileSync(tscPackage, "utf8")).bin.tsc,
  );
  let shared: Record<string, unknown> | undefined;
  const strengthened: Record<string, boolean> = {};
  const visited = new Set<string>();
  const active = new Set<string>();
  const verifyBases = async (file: string): Promise<void> => {
    if (active.has(file))
      throw new Error(`Circular generated config inheritance: ${file}`);
    if (visited.has(file)) return;
    active.add(file);
    try {
      const config = await TsConfigReader.read(file);
      const bases =
        config.extends === undefined
          ? []
          : Array.isArray(config.extends)
            ? config.extends
            : [config.extends];
      for (const base of bases) {
        let resolved: string;
        if (path.isAbsolute(base) || base.startsWith(".")) {
          const candidate = path.resolve(path.dirname(file), base);
          resolved =
            [candidate, candidate + ".json"].find((location) =>
              fs.existsSync(location),
            ) ?? "";
          if (!resolved)
            throw new Error(`Missing generated tsconfig base: ${base}`);
        } else
          resolved = require.resolve(base, { paths: [path.dirname(file)] });
        await verifyBases(resolved);
      }
      visited.add(file);
    } finally {
      active.delete(file);
    }
  };
  for (const directory of directories) {
    if (path.dirname(directory) !== parent)
      throw new Error("Generated migration programs must share their owner.");
    const nest = fs.existsSync(path.join(directory, "packages/api"));
    const api = nest ? path.join(directory, "packages/api") : directory;
    const manifest = path.join(api, "package.json");
    const name: string = JSON.parse(fs.readFileSync(manifest, "utf8")).name;
    if (names.has(name))
      throw new Error(`Duplicate generated API identity: ${name}`);
    names.add(name);
    const resolved = cp
      .execFileSync(
        process.execPath,
        [
          "-e",
          'const fs = require("fs"); const { createRequire } = require("module"); const file = process.argv[1]; const name = JSON.parse(fs.readFileSync(file, "utf8")).name; process.stdout.write(createRequire(file).resolve(name));',
          manifest,
        ],
        {
          encoding: "utf8",
          windowsHide: true,
          env: { ...process.env, NODE_OPTIONS: "" },
        },
      )
      .trim();
    if (
      fs.realpathSync(resolved) !==
      fs.realpathSync(path.join(api, "src/index.ts"))
    )
      throw new Error(
        `Generated API export resolves outside its source entry: ${name}`,
      );
    if (nest) {
      const nodeModules = path.join(directory, "node_modules");
      fs.mkdirSync(nodeModules, { recursive: true });
      const link = path.join(nodeModules, name);
      if (fs.existsSync(link)) {
        if (fs.realpathSync(link) !== fs.realpathSync(api))
          throw new Error(
            `Generated API link resolves to another variant: ${name}`,
          );
      } else fs.symlinkSync(api, link, "junction");
    }
    const projects = nest
      ? [
          "packages/api/tsconfig.json",
          "packages/backend/tsconfig.json",
          "packages/backend/test/tsconfig.json",
        ]
      : ["tsconfig.json", "test/tsconfig.json"];
    for (const project of projects) {
      const filename = path.join(directory, project);
      await verifyBases(filename);
      let parsed: { compilerOptions: Record<string, unknown>; files: string[] };
      try {
        parsed = JSON.parse(
          cp.execFileSync(
            process.execPath,
            [tsc, "--showConfig", "--project", filename],
            {
              cwd: directory,
              encoding: "utf8",
              windowsHide: true,
              env: { ...process.env, NODE_OPTIONS: "" },
            },
          ),
        );
      } catch (error) {
        if (error && typeof error === "object" && "stdout" in error)
          console.error(String(error.stdout));
        throw error;
      }
      if (!parsed.files?.length)
        throw new Error(`Generated project selects no source: ${project}`);
      const options = parsed.compilerOptions;
      const sharedSeparately = new Set([
        "rootDir",
        "outDir",
        "noEmit",
        "stripInternal",
        "noImplicitReturns",
        "noUncheckedIndexedAccess",
        "noUnusedLocals",
        "noUnusedParameters",
        "experimentalDecorators",
        "emitDecoratorMetadata",
        "declaration",
      ]);
      const compatible = Object.fromEntries(
        Object.entries(options)
          .filter(([key]) => !sharedSeparately.has(key))
          .sort(([left], [right]) => left.localeCompare(right)),
      );
      if (shared === undefined) shared = compatible;
      else if (JSON.stringify(shared) !== JSON.stringify(compatible))
        throw new Error(
          `Generated project has incompatible compiler semantics: ${project}`,
        );
      for (const key of [
        "noImplicitReturns",
        "noUncheckedIndexedAccess",
        "noUnusedLocals",
        "noUnusedParameters",
        "experimentalDecorators",
        "emitDecoratorMetadata",
        "declaration",
      ])
        strengthened[key] ||= options[key] === true;
      const root =
        options.rootDir === undefined
          ? directory
          : path.resolve(path.dirname(filename), String(options.rootDir));
      for (const file of parsed.files) {
        const absolute = path.resolve(path.dirname(filename), file);
        const relative = path.relative(root, absolute);
        if (
          relative === ".." ||
          relative.startsWith(".." + path.sep) ||
          path.isAbsolute(relative)
        )
          throw new Error(
            `Generated project root excludes its source: ${project}: ${file}`,
          );
        files.add(absolute);
      }
    }
  }
  fs.writeFileSync(
    path.join(cwd, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          ...shared,
          ...strengthened,
          noEmit: false,
          rootDir: parent,
          outDir: output,
          plugins: [{ transform: "@nestia/core/native/transform.cjs" }],
        },
        files: [...files],
      },
      null,
      2,
    ),
  );
  console.log(
    `Migration preparation: ${directories.length} generated variants, ${files.size} selected source files, one compiler request.`,
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
