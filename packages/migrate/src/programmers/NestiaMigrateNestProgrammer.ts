import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";

import { NestiaMigrateControllerAnalyzer } from "../analyzers/NestiaMigrateControllerAnalyzer";
import ts from "../internal/ts";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateDtoProgrammer } from "./NestiaMigrateDtoProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateNestControllerProgrammer } from "./NestiaMigrateNestControllerProgrammer";
import { NestiaMigrateNestModuleProgrammer } from "./NestiaMigrateNestModuleProgrammer";

export namespace NestiaMigrateNestProgrammer {
  export const write = (
    context: INestiaMigrateContext,
  ): Record<string, string> => {
    const controllers: INestiaMigrateController[] =
      NestiaMigrateControllerAnalyzer.analyze(context.application.routes);
    const statements: [string, ts.Statement[]][] = [
      [
        "packages/backend/src/MyModule.ts",
        NestiaMigrateNestModuleProgrammer.write(controllers),
      ],
      ...controllers.map(
        (c) =>
          [
            `packages/backend/${c.location}/${c.name}.ts`,
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
          [
            `packages/api/src/structures/${key}.ts`,
            writeDtoFile(key, value),
          ] satisfies [string, ts.Statement[]],
      ),
    ];
    const files: Record<string, string> = Object.fromEntries(
      statements.map(([key, value]) => [
        key,
        FilePrinter.write({ statements: value }),
      ]),
    );
    // The template's `packages/api/src/module.ts` re-exports the DTO types
    // through `export * from "./structures"`, so the generated structure files
    // need a barrel replacing the one deleted from the bundled template.
    files["packages/api/src/structures/index.ts"] = writeDtoBarrel(files);
    return files;
  };

  const writeDtoBarrel = (files: Record<string, string>): string => {
    const prefix: string = "packages/api/src/structures/";
    const names: string[] = Object.entries(files)
      .filter(
        ([key, content]) =>
          key.startsWith(prefix) && key.endsWith(".ts") && content.length !== 0,
      )
      .map(([key]) => key.slice(prefix.length, -".ts".length))
      .sort();
    if (names.length === 0) return "export {};\n";
    return names.map((name) => `export * from "./${name}";\n`).join("");
  };

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
          factory.createModuleDeclaration(
            [factory.createModifier(SyntaxKind.ExportKeyword)],
            factory.createIdentifier(modulo.name),
            factory.createModuleBlock(internal),
            NodeFlags.Namespace,
          ),
        );
      }
      output.push(FilePrinter.newLine());
      return output;
    };
}
