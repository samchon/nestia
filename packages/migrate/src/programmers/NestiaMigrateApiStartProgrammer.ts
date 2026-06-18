import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";
import { IHttpMigrateRoute } from "@typia/interface";

import { IdentifierFactory } from "../factories/IdentifierFactory";
import { StatementFactory } from "../factories/StatementFactory";
import ts from "../internal/ts";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateE2eFunctionProgrammer } from "./NestiaMigrateE2eFileProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

export namespace NestiaMigrateApiStartProgrammer {
  export const write = (
    context: INestiaMigrateContext,
  ): Record<string, string> => {
    const importer: NestiaMigrateImportProgrammer =
      new NestiaMigrateImportProgrammer();
    const main: ts.VariableStatement = writeMain(
      context,
      importer,
      pick(context.application.routes),
    );
    const statements: ts.Statement[] = [
      ...importer.toStatements(
        (name) => `@ORGANIZATION/PROJECT-api/lib/structures/${name}`,
      ),
      FilePrinter.newLine(),
      factory.createImportDeclaration(
        undefined,
        factory.createImportClause(
          false,
          undefined,
          factory.createNamedImports([
            factory.createImportSpecifier(
              false,
              undefined,
              factory.createIdentifier("TestGlobal"),
            ),
          ]),
        ),
        factory.createStringLiteral("./TestGlobal"),
      ),
      FilePrinter.newLine(),
      main,
      factory.createExpressionStatement(writeStarter()),
    ];
    return {
      "test/start.ts": FilePrinter.write({ statements }),
    };
  };

  const writeMain = (
    ctx: INestiaMigrateContext,
    importer: NestiaMigrateImportProgrammer,
    route: IHttpMigrateRoute,
  ): ts.VariableStatement =>
    StatementFactory.constant({
      name: "main",
      value: factory.createArrowFunction(
        [factory.createToken(SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        undefined,
        factory.createBlock(
          [
            writeConnection(ctx, importer),
            ...NestiaMigrateE2eFunctionProgrammer.writeBody({
              config: ctx.config,
              components: ctx.application.document().components,
              importer,
              route,
            }),
          ],
          true,
        ),
      ),
    });

  const writeConnection = (
    ctx: INestiaMigrateContext,
    importer: NestiaMigrateImportProgrammer,
  ): ts.VariableStatement =>
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            "connection",
            undefined,
            factory.createTypeReferenceNode(
              factory.createQualifiedName(
                factory.createIdentifier(
                  importer.external({
                    type: "default",
                    library: "@ORGANIZATION/PROJECT-api",
                    name: "api",
                  }),
                ),
                factory.createIdentifier("IConnection"),
              ),
            ),
            factory.createObjectLiteralExpression(
              [
                factory.createSpreadAssignment(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("TestGlobal"),
                      "connection",
                    ),
                    undefined,
                    undefined,
                  ),
                ),
                ...(ctx.application.document().servers?.[0]?.url?.length
                  ? [
                      factory.createPropertyAssignment(
                        "host",
                        factory.createStringLiteral(
                          ctx.application.document().servers![0]!.url,
                        ),
                      ),
                    ]
                  : []),
                ...(ctx.config.simulate === true
                  ? [
                      factory.createPropertyAssignment(
                        "simulate",
                        factory.createTrue(),
                      ),
                    ]
                  : []),
              ],
              true,
            ),
          ),
        ],
        NodeFlags.Const,
      ),
    );

  const writeStarter = (): ts.CallExpression =>
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createCallExpression(
          factory.createIdentifier("main"),
          undefined,
          undefined,
        ),
        "catch",
      ),
      undefined,
      [
        factory.createArrowFunction(
          undefined,
          undefined,
          [IdentifierFactory.parameter("exp")],
          undefined,
          undefined,
          factory.createBlock(
            [
              factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("console"),
                    "log",
                  ),
                  undefined,
                  [factory.createIdentifier("exp")],
                ),
              ),
              factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("process"),
                    "exit",
                  ),
                  undefined,
                  [
                    factory.createPrefixMinus(
                      factory.createNumericLiteral("1"),
                    ),
                  ],
                ),
              ),
            ],
            true,
          ),
        ),
      ],
    );
}

const pick = <T>(array: T[]): T => {
  const rand: number = Math.random() * array.length;
  const index: number = Math.min(array.length - 1, Math.floor(rand));
  return array[index]!;
};
