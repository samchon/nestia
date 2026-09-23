import { type Node, SyntaxKind, factory } from "@ttsc/factory";
import fs from "fs";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedApplication } from "../../structures/ITypedApplication";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedMcpRoute } from "../../structures/ITypedMcpRoute";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { MapUtil } from "../../utils/MapUtil";
import { StringUtil } from "../../utils/StringUtil";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkHttpRouteProgrammer } from "./SdkHttpRouteProgrammer";
import { SdkMcpRouteProgrammer } from "./SdkMcpRouteProgrammer";
import { SdkRouteDirectory } from "./SdkRouteDirectory";
import { SdkWebSocketRouteProgrammer } from "./SdkWebSocketRouteProgrammer";

export namespace SdkFileProgrammer {
  /* ---------------------------------------------------------
        CONSTRUCTOR
    --------------------------------------------------------- */
  export const generate = async (app: ITypedApplication): Promise<void> => {
    // CONSTRUCT FOLDER TREE
    const root: SdkRouteDirectory = new SdkRouteDirectory(null, "functional");
    for (const route of app.routes) emplace(root)(route);

    // ITERATE FILES
    await iterate(app.project)(root)(`${app.project.config.output}/functional`);
  };

  const emplace =
    (directory: SdkRouteDirectory) =>
    (route: ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute): void => {
      // OPEN DIRECTORIES
      for (const key of route.accessor.slice(0, -1)) {
        directory = MapUtil.take(
          directory.children,
          key,
          () => new SdkRouteDirectory(directory, key),
        );
      }

      // ADD ROUTE
      directory.routes.push(route);
    };

  /* ---------------------------------------------------------
        FILE ITERATOR
    --------------------------------------------------------- */
  const iterate =
    (project: INestiaProject) =>
    (directory: SdkRouteDirectory) =>
    async (outDir: string): Promise<void> => {
      // CREATE A NEW DIRECTORY
      await fs.promises.mkdir(outDir, { recursive: true });

      // ITERATE CHILDREN
      const statements: Node[] = [];
      for (const [key, value] of directory.children) {
        await iterate(project)(value)(`${outDir}/${key}`);
        statements.push(
          factory.createExportDeclaration(
            undefined,
            false,
            factory.createNamespaceExport(factory.createIdentifier(key)),
            factory.createStringLiteral(`./${key}/index`),
          ),
        );
      }
      if (statements.length && directory.routes.length)
        statements.push(FilePrinter.enter());

      // ITERATE ROUTES
      const write = (locals: Map<AnyRoute, string>) => {
        const importer: ImportDictionary = new ImportDictionary(
          `${outDir}/index.ts`,
        );
        const output: Node[] = [];
        directory.routes.forEach((route, i) => {
          if (!(project.config.clone === true && route.protocol === "http"))
            importer.declarations(route.imports);
          const local: string | undefined = locals.get(route);
          const target: AnyRoute =
            local === undefined ? route : { ...route, name: local };
          const written: Node[] =
            target.protocol === "http"
              ? SdkHttpRouteProgrammer.write(project)(importer)(target)
              : target.protocol === "websocket"
                ? SdkWebSocketRouteProgrammer.write(project)(importer)(target)
                : SdkMcpRouteProgrammer.write(project)(importer)(target);
          if (local !== undefined) {
            written.forEach(unexport);
            written.push(
              factory.createExportDeclaration(
                undefined,
                false,
                factory.createNamedExports([
                  factory.createExportSpecifier(false, local, route.name),
                ]),
                undefined,
              ),
            );
          }
          output.push(...written);
          if (i !== directory.routes.length - 1)
            output.push(FilePrinter.enter());
        });
        return { importer, statements: output };
      };

      // A route's function and namespace are declared in the module scope,
      // where the file's imports and the globals its bodies reference live
      // too. A route named like one of them shadows it for the whole file, or
      // conflicts with the import, so the SDK would not compile (#1647); a
      // method named `tags` whose path parameter is typed with `tags.Format`
      // is enough. Its public name cannot change, so it is declared under a
      // local one and exported as itself.
      let file = write(new Map());
      const scope: Set<string> = new Set([
        ...file.importer.locals(),
        ...MODULE_GLOBALS,
      ]);
      const shadowing: AnyRoute[] = directory.routes.filter((r) =>
        scope.has(r.name),
      );
      if (shadowing.length !== 0) {
        const escape = StringUtil.escapeDuplicate([
          ...scope,
          ...directory.routes.map((r) => r.name),
        ]);
        file = write(new Map(shadowing.map((r) => [r, escape(r.name)])));
      }
      const importer: ImportDictionary = file.importer;
      statements.push(...file.statements);

      // FINALIZE THE CONTENT
      if (directory.routes.length !== 0)
        statements.push(
          ...importer.toStatements(outDir),
          ...(!importer.empty() && statements.length
            ? [FilePrinter.enter()]
            : []),
          ...statements.splice(0, statements.length),
        );
      await FilePrinter.write({
        location: importer.file,
        statements,
        top:
          "/**\n" +
          " * @packageDocumentation\n" +
          ` * @module ${directory.module}\n` +
          " * @nestia Generated by Nestia - https://github.com/samchon/nestia \n" +
          " */\n" +
          "//================================================================\n",
      });
    };
}

type AnyRoute = ITypedHttpRoute | ITypedWebSocketRoute | ITypedMcpRoute;

/**
 * Globals the generated route bodies reference, and names TypeScript reserves
 * in a module's top-level scope: `Promise` in one with async functions, and
 * `require` and `exports` in a CommonJS one.
 */
const MODULE_GLOBALS: string[] = [
  "Array",
  "Error",
  "JSON",
  "Object",
  "Promise",
  "ReadableStream",
  "String",
  "URLSearchParams",
  "encodeURIComponent",
  "exports",
  "require",
  "undefined",
];

/** Drops the `export` modifier of a route's function or namespace. */
const unexport = (node: Node): void => {
  const declaration = node as {
    kind: string;
    modifiers?: Array<{ kind: string; token?: string }>;
  };
  if (
    (declaration.kind === "FunctionDeclaration" ||
      declaration.kind === "ModuleDeclaration") &&
    declaration.modifiers !== undefined
  )
    declaration.modifiers = declaration.modifiers.filter(
      (m) => m.token !== SyntaxKind.ExportKeyword,
    );
};
