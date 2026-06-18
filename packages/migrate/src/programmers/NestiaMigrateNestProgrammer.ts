import { NodeFlags, type Statement, SyntaxKind, factory } from "@ttsc/factory";

import { NestiaMigrateControllerAnalyzer } from "../analyzers/NestiaMigrateControllerAnalyzer";
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
    const statements: [string, Statement[]][] = [
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
          ] satisfies [string, Statement[]],
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
            Statement[],
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

  const writeDtoFile = (
    key: string,
    modulo: NestiaMigrateDtoProgrammer.IModule,
  ): Statement[] => {
    const importer = new NestiaMigrateImportProgrammer();
    const statements: Statement[] = iterate(importer)(modulo);
    if (statements.length === 0) return [];

    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      ...statements,
    ];
  };

  const iterate =
    (importer: NestiaMigrateImportProgrammer) =>
    (modulo: NestiaMigrateDtoProgrammer.IModule): Statement[] => {
      const output: Statement[] = [];
      if (modulo.programmer !== null) output.push(modulo.programmer(importer));
      if (modulo.children.size) {
        const internal: Statement[] = [];
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
