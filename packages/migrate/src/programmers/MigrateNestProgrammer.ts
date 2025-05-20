import ts from "typescript";

import { MigrateControllerAnalyzer } from "../analyzers/MigrateControllerAnalyzer";
import { IHttpMigrateController } from "../structures/IHttpMigrateController";
import { IHttpMigrateFile } from "../structures/IHttpMigrateFile";
import { IHttpMigrateProgram } from "../structures/IHttpMigrateProgram";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateDtoProgrammer } from "./MigrateDtoProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateNestControllerProgrammer } from "./MigrateNestControllerProgrammer";
import { MigrateNestModuleProgrammer } from "./MigrateNestModuleProgrammer";

export namespace MigrateNestProgrammer {
  export const write = (program: IHttpMigrateProgram): IHttpMigrateFile[] => {
    const controllers: IHttpMigrateController[] =
      MigrateControllerAnalyzer.analyze({
        routes: program.routes,
      });
    return [
      {
        location: "src",
        file: "MyModule.ts",
        statements: MigrateNestModuleProgrammer.write(controllers),
      },
      ...controllers.map((c) => ({
        location: c.location,
        file: `${c.name}.ts`,
        statements: MigrateNestControllerProgrammer.write(program)(
          program.document.components,
        )(c),
      })),
      ...[
        ...MigrateDtoProgrammer.compose(program.document.components).entries(),
      ].map(([key, value]) => ({
        location: "src/api/structures",
        file: `${key}.ts`,
        statements: writeDtoFile(key, value),
      })),
    ].map((o) => ({
      location: o.location,
      file: o.file,
      content: FilePrinter.write({ statements: o.statements }),
    }));
  };

  const writeDtoFile = (
    key: string,
    modulo: MigrateDtoProgrammer.IModule,
  ): ts.Statement[] => {
    const importer = new MigrateImportProgrammer();
    const statements: ts.Statement[] = iterate(importer)(modulo);
    if (statements.length === 0) return [];

    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.newLine()]),
      ...statements,
    ];
  };

  const iterate =
    (importer: MigrateImportProgrammer) =>
    (modulo: MigrateDtoProgrammer.IModule): ts.Statement[] => {
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
