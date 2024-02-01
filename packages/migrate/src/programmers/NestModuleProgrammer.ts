import ts from "typescript";

import { IMigrateController } from "../structures/IMigrateController";
import { FilePrinter } from "../utils/FilePrinter";

export namespace NestModuleProgrammer {
  export const write = (controllers: IMigrateController[]): ts.Statement[] => [
    $import("@nestjs/common")("Module"),
    ...(controllers.length ? [FilePrinter.enter()] : []),
    ...controllers.map((c) =>
      $import(`${c.location.replace("src/", "./")}/${c.name}`)(c.name),
    ),
    ...(controllers.length ? [FilePrinter.enter()] : []),
    ts.factory.createClassDeclaration(
      [
        ts.factory.createDecorator(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier("Module"),
            undefined,
            [
              ts.factory.createObjectLiteralExpression(
                [
                  ts.factory.createPropertyAssignment(
                    ts.factory.createIdentifier("controllers"),
                    ts.factory.createArrayLiteralExpression(
                      controllers.map((c) =>
                        ts.factory.createIdentifier(c.name),
                      ),
                    ),
                  ),
                ],
                true,
              ),
            ],
          ),
        ),
        ts.factory.createToken(ts.SyntaxKind.ExportKeyword),
      ],
      "MyModule",
      undefined,
      undefined,
      [],
    ),
  ];
}

const $import = (file: string) => (instance: string) =>
  ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(
          false,
          undefined,
          ts.factory.createIdentifier(instance),
        ),
      ]),
    ),
    ts.factory.createStringLiteral(file),
  );
