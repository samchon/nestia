import { HashMap, hash } from "tstl";
import ts from "typescript";

import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateApiFileProgrammer } from "./NestiaMigrateApiFileProgrammer";
import { NestiaMigrateDtoProgrammer } from "./NestiaMigrateDtoProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

/**
 * Namespace containing functions for generating API-related files.
 * 
 * This programmer is responsible for generating API client functions, type definitions,
 * and related utilities that allow consumers to interact with the migrated API.
 * It organizes routes into logical namespaces and generates both functional APIs
 * and type-safe DTOs.
 * 
 * @author Samchon
 */
export namespace NestiaMigrateApiProgrammer {
  /**
   * Generates all API-related files from the migration context.
   * 
   * Creates a comprehensive set of files including:
   * - Functional API client methods organized by namespace
   * - Type definitions and DTOs for requests/responses
   * - Proper import management and dependency resolution
   * - Index files for easy module access
   * 
   * @param ctx - The migration context containing application data and configuration
   * @returns Record mapping file paths to their generated content
   */
  export const write = (ctx: INestiaMigrateContext): Record<string, string> => {
    const dict: HashMap<string[], NestiaMigrateApiFileProgrammer.IProps> =
      new HashMap(
        (x) => hash(x.join(".")),
        (x, y) => x.length === y.length && x.join(".") === y.join("."),
      );
    for (const route of ctx.application.routes) {
      const namespace: string[] = route.accessor.slice(0, -1);
      let last: NestiaMigrateApiFileProgrammer.IProps = dict.take(
        namespace,
        () => ({
          config: ctx.config,
          components: ctx.application.document().components,
          namespace,
          routes: [],
          children: new Set(),
        }),
      );
      last.routes.push(route);
      namespace.forEach((_s, i, array) => {
        const partial: string[] = namespace.slice(0, array.length - i - 1);
        const props: NestiaMigrateApiFileProgrammer.IProps = dict.take(
          partial,
          () => ({
            config: ctx.config,
            components: ctx.application.document().components,
            namespace: partial,
            children: new Set(),
            routes: [],
          }),
        );
        props.children.add(last.namespace.at(-1)!);
        last = props;
      });
    }

    // DO GENERATE
    const files: Record<string, string> = Object.fromEntries(
      dict.toJSON().map(({ second: value }) => [
        `src/${ctx.mode === "nest" ? "api/" : ""}functional/${[...value.namespace, "index.ts"].join("/")}`,
        FilePrinter.write({
          statements: NestiaMigrateApiFileProgrammer.write({
            ...value,
            config: ctx.config,
            components: ctx.application.document().components,
          }),
        }),
      ]),
    );
    if (ctx.mode === "sdk")
      for (const [key, value] of NestiaMigrateDtoProgrammer.compose({
        config: ctx.config,
        components: ctx.application.document().components,
      }).entries())
        files[`src/structures/${key}.ts`] = FilePrinter.write({
          statements: writeDtoFile(key, value),
        });
    return files;
  };

  const writeDtoFile = (
    key: string,
    modulo: NestiaMigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const importer = new NestiaMigrateImportProgrammer();
    const statements: ts.Statement[] = iterate(importer, modulo);
    if (statements.length === 0) return [];
    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      ...statements,
    ];
  };

  const iterate = (
    importer: NestiaMigrateImportProgrammer,
    modulo: NestiaMigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const output: ts.Statement[] = [];
    if (modulo.programmer !== null) output.push(modulo.programmer(importer));
    if (modulo.children.size !== 0) {
      const internal: ts.Statement[] = [];
      for (const child of modulo.children.values())
        internal.push(...iterate(importer, child));
      output.push(
        ts.factory.createModuleDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          ts.factory.createIdentifier(modulo.name),
          ts.factory.createModuleBlock(internal),
          ts.NodeFlags.Namespace,
        ),
      );
    }
    output.push(FilePrinter.newLine());
    return output;
  };
}
