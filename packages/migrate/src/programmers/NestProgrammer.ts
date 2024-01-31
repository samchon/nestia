import ts from "typescript";

import { IMigrateFile } from "../structures/IMigrateFile";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { FilePrinter } from "../utils/FilePrinter";
import { DtoProgrammer } from "./DtoProgrammer";
import { ImportProgrammer } from "./ImportProgrammer";
import { NestControllerProgrammer } from "./NestControllerProgrammer";
import { NestModuleProgrammer } from "./NestModuleProgrammer";

export namespace NestProgrammer {
  export const write = (program: IMigrateProgram): IMigrateFile[] =>
    [
      {
        location: "src",
        file: "MyModule.ts",
        statements: NestModuleProgrammer.write(program.controllers),
      },
      ...program.controllers.map((c) => ({
        location: c.location,
        file: `${c.name}.ts`,
        statements: NestControllerProgrammer.write(program.swagger.components)(
          c,
        ),
      })),
      ...[...DtoProgrammer.write(program.swagger.components).entries()].map(
        ([key, value]) => ({
          location: "src/api/structures",
          file: `${key}.ts`,
          statements: writeDtoFile(key, value),
        }),
      ),
    ].map((o) => ({
      location: o.location,
      file: o.file,
      content: FilePrinter.write({ statements: o.statements }),
    }));

  const writeDtoFile = (
    key: string,
    modulo: DtoProgrammer.IModule,
  ): ts.Statement[] => {
    const importer = new ImportProgrammer();
    const statements: ts.Statement[] = iterate(importer)(modulo);
    if (statements.length === 0) return [];

    return [
      ...importer.toStatements((name) => `./${name}`, key),
      ...(importer.empty() ? [] : [FilePrinter.enter()]),
      ...statements,
    ];
  };

  const iterate =
    (importer: ImportProgrammer) =>
    (modulo: DtoProgrammer.IModule): ts.Statement[] => {
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
      return output;
    };
}
