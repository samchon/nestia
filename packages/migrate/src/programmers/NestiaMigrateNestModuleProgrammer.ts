import { TypeScriptFactory } from "@nestia/factory";
import ts from "../internal/ts";

import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { FilePrinter } from "../utils/FilePrinter";

export namespace NestiaMigrateNestModuleProgrammer {
  export const write = (
    controllers: INestiaMigrateController[],
  ): ts.Statement[] => [
    $import("@nestjs/common")("Module"),
    ...(controllers.length ? [FilePrinter.newLine()] : []),
    ...controllers.map((c) =>
      $import(`${c.location.replace("src/", "./")}/${c.name}`)(c.name),
    ),
    ...(controllers.length ? [FilePrinter.newLine()] : []),
    TypeScriptFactory.createClassDeclaration(
      [
        TypeScriptFactory.createDecorator(
          TypeScriptFactory.createCallExpression(
            TypeScriptFactory.createIdentifier("Module"),
            undefined,
            [
              TypeScriptFactory.createObjectLiteralExpression(
                [
                  TypeScriptFactory.createPropertyAssignment(
                    TypeScriptFactory.createIdentifier("controllers"),
                    TypeScriptFactory.createArrayLiteralExpression(
                      controllers.map((c) =>
                        TypeScriptFactory.createIdentifier(c.name),
                      ),
                      true,
                    ),
                  ),
                ],
                true,
              ),
            ],
          ),
        ),
        TypeScriptFactory.createToken(ts.SyntaxKind.ExportKeyword),
      ],
      "MyModule",
      undefined,
      undefined,
      [],
    ),
  ];
}

const $import = (file: string) => (instance: string) =>
  TypeScriptFactory.createImportDeclaration(
    undefined,
    TypeScriptFactory.createImportClause(
      false,
      undefined,
      TypeScriptFactory.createNamedImports([
        TypeScriptFactory.createImportSpecifier(
          false,
          undefined,
          TypeScriptFactory.createIdentifier(instance),
        ),
      ]),
    ),
    TypeScriptFactory.createStringLiteral(file),
  );
