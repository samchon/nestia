import ts from "typescript";

import { NestiaMigrateControllerAnalyzer } from "../analyzers/NestiaMigrateControllerAnalyzer";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateDtoProgrammer } from "./NestiaMigrateDtoProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateNestControllerProgrammer } from "./NestiaMigrateNestControllerProgrammer";
import { NestiaMigrateNestModuleProgrammer } from "./NestiaMigrateNestModuleProgrammer";

/**
 * Namespace containing functions for generating NestJS application code.
 * 
 * This programmer is responsible for generating complete NestJS applications
 * including controllers, modules, DTOs, and other necessary files from
 * OpenAPI specifications.
 * 
 * @author Samchon
 */
export namespace NestiaMigrateNestProgrammer {
  /**
   * Generates all NestJS application files from the migration context.
   * 
   * Creates a complete set of NestJS files including:
   * - Main application module
   * - Controller classes for each API endpoint group
   * - DTO classes for request/response types
   * - Proper import statements and dependencies
   * 
   * @param context - The migration context containing application data and configuration
   * @returns Record mapping file paths to their generated content
   */
  export const write = (
    context: INestiaMigrateContext,
  ): Record<string, string> => {
    const controllers: INestiaMigrateController[] =
      NestiaMigrateControllerAnalyzer.analyze(context.application.routes);
    const statements: [string, ts.Statement[]][] = [
      ["src/MyModule.ts", NestiaMigrateNestModuleProgrammer.write(controllers)],
      ...controllers.map(
        (c) =>
          [
            `${c.location}/${c.name}.ts`,
            NestiaMigrateNestControllerProgrammer.write({
              config: context.config,
              components: context.application.document().components,
              controller: c,
            }),
          ] satisfies [string, ts.Statement[]],
      ),
      ...[
        ...NestiaMigrateDtoProgrammer.compose({
          config: context.config,
          components: context.application.document().components,
        }).entries(),
      ].map(
        ([key, value]) =>
          [`src/api/structures/${key}.ts`, writeDtoFile(key, value)] satisfies [
            string,
            ts.Statement[],
          ],
      ),
    ];
    return Object.fromEntries(
      statements.map(([key, value]) => [
        key,
        FilePrinter.write({ statements: value }),
      ]),
    );
  };

  /**
   * Generates DTO file content with proper imports and structure.
   * 
   * @param key - The DTO module key/name
   * @param modulo - The DTO module structure to generate
   * @returns Array of TypeScript statements for the DTO file
   * @internal
   */
  const writeDtoFile = (
    key: string,
    modulo: NestiaMigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const importer = new NestiaMigrateImportProgrammer();
    const statements: ts.Statement[] = iterate(importer)(modulo);
    if (statements.length === 0) return [];

    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      ...statements,
    ];
  };

  /**
   * Recursively iterates through DTO modules to generate TypeScript statements.
   * 
   * @param importer - The import programmer for managing dependencies
   * @returns Function that processes DTO modules and returns statements
   * @internal
   */
  const iterate =
    (importer: NestiaMigrateImportProgrammer) =>
    (modulo: NestiaMigrateDtoProgrammer.IModule): ts.Statement[] => {
      const output: ts.Statement[] = [];
      if (modulo.programmer !== null) output.push(modulo.programmer(importer));
      if (modulo.children.size) {
        const internal: ts.Statement[] = [];
        for (const child of modulo.children.values())
          internal.push(...iterate(importer)(child));
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
