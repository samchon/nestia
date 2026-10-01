import { SyntaxKind, factory } from "@ttsc/factory";

import ts from "../internal/ts";
import { INestiaMigrateController } from "../structures/INestiaMigrateController";
import { FilePrinter } from "../utils/FilePrinter";

/**
 * Generates the NestJS module that lists the controllers.
 *
 * @evidence contracts/common.md#principled-implementation The module imports every controller from its location and lists them in the `controllers` array of a decorated class.
 * @evidence contracts/common.md#clear-and-simple-design One function and one private import builder.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The controllers follow the analysis.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateNestModuleProgrammer {
  /**
   * Returns the statements of the module file.
   *
   * @evidence contracts/common.md#principled-implementation The import paths turn the `src/` prefix of a controller location into `./`, so the module can import from its own directory.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The names follow the controllers.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
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
      undefined,
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
