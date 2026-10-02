import { parse } from "@babel/parser";
import fs from "fs";
import path from "path";

import { ITypedApplication } from "../../structures/ITypedApplication";

/**
 * Copies the declarations a WebSocket route's types come from into the
 * `structures` directory.
 *
 * @evidence contracts/common.md#principled-implementation A WebSocket route refers to types by import, so the declaration and the declarations it uses are copied as text from the source files, not rebuilt from metadata.
 * @evidence contracts/common.md#clear-and-simple-design One public function with syntax-tree helpers for declarations and imports.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The TypeScript syntax parser determines declaration and import boundaries, including automatic semicolon insertion; a package file or a name declared differently in two files is never copied.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidence contracts/portability.md#os-neutral-implementation Source candidates use Node path.resolve/join and fs.stat/readFile; outputs use recursive mkdir and UTF-8 writes. Retained relative imports are rebased with native path.relative and rendered with module separators; cross-volume absolute paths remain absolute. Supported source candidates currently include .ts/.tsx/.d.ts rather than .mts/.cts.
 */
export namespace SdkWebSocketCloneProgrammer {
  /**
   * Copies named project-local declarations imported by WebSocket routes, and
   * returns the identities successfully cloned. Default and namespace imports
   * remain source imports; a missing source or conflicting output name is not
   * reported as cloned.
   *
   * @evidence contracts/common.md#principled-implementation Named imports are followed by resolved source/name identity; pending entries break recursive dependency cycles, written entries reuse completed copies, and missing or conflicting declarations return false. External, default and namespace bindings remain imports rather than reconstructed declarations.
   * @evidence contracts/common.md#clear-and-simple-design One loop over the routes' imports.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the imports that resolved to a source file are reported.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation Source lookup uses native fs.stat and path operations and rejects dependency paths by a node_modules component. The output uses the configured native directory; cache keys retain resolved pathname spelling rather than claiming canonical case or symlink identity.
   */
  export const write = async (app: ITypedApplication): Promise<Set<string>> => {
    const ctx: IContext = {
      output: `${app.project.config.output}/structures`,
      outputs: new Map(),
      visited: new Map(),
    };
    const cloned: Set<string> = new Set();
    for (const route of app.routes)
      if (route.protocol === "websocket")
        for (const imp of route.imports)
          for (const local of imp.elements) {
            const imported: string = imp.elementAliases?.[local] ?? local;
            if (await clone(ctx)(imp.file, imported))
              cloned.add(importKey(imp.file, imported));
          }
    return cloned;
  };

  const clone =
    (ctx: IContext) =>
    async (file: string, name: string): Promise<boolean> => {
      const location: string | null = await resolveSourceFile(file);
      if (location === null || isNodeModulesPath(location)) return false;

      const key: string = `${location}#${name}`;
      const status: CloneStatus | undefined = ctx.visited.get(key);
      if (status === "written" || status === "pending") return true;
      else if (status === "missing") return false;
      ctx.visited.set(key, "pending");

      const text: string = await fs.promises.readFile(location, "utf8");
      const declarations: string[] = getDeclarations(text, name, location);
      if (declarations.length === 0) {
        ctx.visited.set(key, "missing");
        return false;
      }

      const body: string = declarations.join("\n\n");
      const imports: string[] = await collectImports(ctx)({
        body,
        location,
        source: text,
        target: name,
      });

      const content: string =
        [...imports, body].filter((line) => line.length).join("\n\n") + "\n";
      const oldbie: string | undefined = ctx.outputs.get(name);
      if (oldbie !== undefined && oldbie !== content) {
        ctx.visited.set(key, "missing");
        return false;
      }
      ctx.outputs.set(name, content);

      await fs.promises.mkdir(ctx.output, { recursive: true });
      await fs.promises.writeFile(`${ctx.output}/${name}.ts`, content, "utf8");
      ctx.visited.set(key, "written");
      return true;
    };

  const collectImports =
    (ctx: IContext) =>
    async (props: {
      body: string;
      location: string;
      source: string;
      target: string;
    }): Promise<string[]> => {
      const imports: string[] = [];
      const add = (line: string): void => {
        if (imports.includes(line) === false) imports.push(line);
      };

      for (const imp of getImports(props.source, props.location)) {
        const relative: boolean = imp.specifier.startsWith(".");
        const retained: Set<string> = new Set();
        for (const elem of imp.elements) {
          if (uses(props.body, elem.local, props.location) === false) continue;

          if (relative === false) {
            retained.add(elem.local);
            continue;
          }

          const sourceFile: string = path.resolve(
            path.dirname(props.location),
            imp.specifier,
          );
          if ((await clone(ctx)(sourceFile, elem.imported)) === false) {
            retained.add(elem.local);
            continue;
          }
          add(
            `import type { ${elem.imported}${elem.imported === elem.local ? "" : ` as ${elem.local}`} } from "./${elem.imported}";`,
          );
        }
        for (const name of [imp.default, imp.namespace])
          if (name !== null && uses(props.body, name, props.location))
            retained.add(name);
        if (retained.size !== 0) {
          const specifier: string = relative
            ? relativeImport(
                ctx.output,
                path.resolve(path.dirname(props.location), imp.specifier),
              )
            : imp.specifier;
          add(retainedImport(imp, retained, specifier));
        }
      }

      for (const name of getExportedNames(props.source, props.location)) {
        if (name === null || name === props.target) continue;
        if (uses(props.body, name, props.location) === false) continue;
        if ((await clone(ctx)(props.location, name)) === true)
          add(`import type { ${name} } from "./${name}";`);
      }
      return imports.sort();
    };

  const resolveSourceFile = async (file: string): Promise<string | null> => {
    const base: string = trimRuntimeExtension(file);
    const candidates: string[] = [
      file,
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.d.ts`,
      path.join(base, "index.ts"),
      path.join(base, "index.d.ts"),
    ];
    for (const candidate of candidates) {
      try {
        const location: string = path.resolve(candidate);
        const stat: fs.Stats = await fs.promises.stat(location);
        if (stat.isFile()) return location;
      } catch {}
    }
    return null;
  };

  const trimRuntimeExtension = (file: string): string => {
    for (const ext of [".js", ".jsx", ".mjs", ".cjs"])
      if (file.endsWith(ext)) return file.slice(0, -ext.length);
    return file;
  };

  const syntax = (source: string, filename: string) => {
    const options = {
      sourceType: "module",
      sourceFilename: filename,
    } as const;
    const dialect = (decorators: "decorators-legacy" | "decorators") =>
      parse(source, {
        ...options,
        plugins: [
          decorators,
          "decoratorAutoAccessors",
          ["typescript", { dts: /\.d\.[cm]?ts$/.test(filename) }],
          ...(filename.endsWith(".tsx") ? (["jsx"] as const) : []),
        ],
      }).program;
    // Nest parameter decorators use the legacy dialect. Standard decorators
    // also permit placement after export; retry that strict grammar without
    // enabling error recovery or accepting a partial syntax tree.
    try {
      return dialect("decorators-legacy");
    } catch {
      return dialect("decorators");
    }
  };

  const exportedName = (
    statement: ReturnType<typeof syntax>["body"][number],
  ): string | null => {
    if (statement.type !== "ExportNamedDeclaration") return null;
    const declaration = statement.declaration;
    if (
      declaration === null ||
      declaration === undefined ||
      !("id" in declaration)
    )
      return null;
    return declaration.id?.type === "Identifier" ? declaration.id.name : null;
  };

  const getDeclarations = (
    source: string,
    name: string,
    filename: string,
  ): string[] =>
    syntax(source, filename)
      .body.filter((statement) => exportedName(statement) === name)
      .map((statement) => source.slice(statement.start!, statement.end!));

  const getExportedNames = (source: string, filename: string): string[] =>
    syntax(source, filename)
      .body.map(exportedName)
      .filter((name): name is string => name !== null);

  const getImports = (source: string, filename: string): IImport[] =>
    syntax(source, filename)
      .body.filter((statement) => statement.type === "ImportDeclaration")
      .map((statement) => ({
        node: statement,
        text: source.slice(statement.start!, statement.end!),
        specifier: statement.source.value,
        default:
          statement.specifiers.find(
            (specifier) => specifier.type === "ImportDefaultSpecifier",
          )?.local.name ?? null,
        namespace:
          statement.specifiers.find(
            (specifier) => specifier.type === "ImportNamespaceSpecifier",
          )?.local.name ?? null,
        elements: statement.specifiers
          .filter((specifier) => specifier.type === "ImportSpecifier")
          .map((specifier) => ({
            imported:
              specifier.imported.type === "Identifier"
                ? specifier.imported.name
                : specifier.imported.value,
            local: specifier.local.name,
          })),
      }));

  /** Rebuilds only retained bindings, preserving their authored type modifiers. */
  const retainedImport = (
    imp: IImport,
    retained: Set<string>,
    specifier: string,
  ): string => {
    const clauses: string[] = [];
    const named: string[] = [];
    for (const binding of imp.node.specifiers) {
      if (!retained.has(binding.local.name)) continue;
      if (binding.type === "ImportDefaultSpecifier")
        clauses.push(binding.local.name);
      else if (binding.type === "ImportNamespaceSpecifier")
        clauses.push(`* as ${binding.local.name}`);
      else
        named.push(
          imp.text.slice(
            binding.start! - imp.node.start!,
            binding.end! - imp.node.start!,
          ),
        );
    }
    if (named.length) clauses.push(`{ ${named.join(", ")} }`);
    const suffix: string = imp.text.slice(
      imp.node.source.end! - imp.node.start!,
    );
    return `import${imp.node.importKind === "type" ? " type" : ""} ${clauses.join(", ")} from ${JSON.stringify(specifier)}${suffix}`;
  };

  /** Module spelling from a copied declaration to its original source import. */
  const relativeImport = (output: string, source: string): string => {
    const native: string = path.relative(output, source);
    const relative: string = native.split(path.sep).join("/");
    return path.isAbsolute(native) || relative.startsWith(".")
      ? relative
      : `./${relative}`;
  };

  const uses = (body: string, name: string, filename: string): boolean => {
    const visit = (value: unknown): boolean => {
      if (value === null || typeof value !== "object") return false;
      if (Array.isArray(value)) return value.some(visit);
      const node = value as Record<string, unknown>;
      if (node.type === "Identifier" && node.name === name) return true;
      return Object.entries(node).some(
        ([key, child]) =>
          key !== "comments" &&
          key !== "leadingComments" &&
          key !== "trailingComments" &&
          key !== "innerComments" &&
          key !== "loc" &&
          visit(child),
      );
    };
    return visit(syntax(body, filename));
  };

  /**
   * Returns the key of an import: its file and name.
   *
   * @evidence contracts/common.md#principled-implementation The pair identifies one imported declaration.
   * @evidence contracts/common.md#clear-and-simple-design One template.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The key is the same wherever it is built.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation importKey combines the supplied source identity and declaration name without opening a path or resolving filesystem identity; its caller owns source resolution.
   */
  export const importKey = (file: string, name: string): string =>
    `${file}#${name}`;

  /**
   * Reports whether a path lies under a `node_modules` directory.
   *
   * @evidence contracts/common.md#principled-implementation The path is resolved and split on both separators, so it holds on every platform.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A package's declaration is never copied.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidence contracts/portability.md#os-neutral-implementation path.resolve produces a native absolute spelling and splitting accepts both native separator forms. The literal node_modules component classifies installation layout; it does not inspect symlink targets or assert a volume's case equivalence.
   */
  export const isNodeModulesPath = (file: string): boolean =>
    path
      .resolve(file)
      .split(/[\\/]+/)
      .includes("node_modules");
}

interface IContext {
  output: string;
  outputs: Map<string, string>;
  visited: Map<string, CloneStatus>;
}

type CloneStatus = "pending" | "written" | "missing";

interface IImport {
  node: Extract<
    ReturnType<typeof parse>["program"]["body"][number],
    { type: "ImportDeclaration" }
  >;
  text: string;
  specifier: string;
  default: string | null;
  namespace: string | null;
  elements: IImportElement[];
}

interface IImportElement {
  imported: string;
  local: string;
}
