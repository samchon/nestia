import { SyntaxKind, factory } from "@ttsc/factory";

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
    factory.createClassDeclaration(
      [
        factory.createDecorator(
          factory.createCallExpression(
            factory.createIdentifier("Module"),
            undefined,
            [
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    factory.createIdentifier("controllers"),
                    factory.createArrayLiteralExpression(
                      controllers.map((c) => factory.createIdentifier(c.name)),
                      true,
                    ),
                  ),
                ],
                true,
              ),
            ],
          ),
        ),
        factory.createToken(SyntaxKind.ExportKeyword),
      ],
      "MyModule",
      undefined,
      undefined,
      [],
    ),
  ];
}

const $import = (file: string) => (instance: string) =>
  factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier(instance),
        ),
      ]),
    ),
    factory.createStringLiteral(file),
  );
