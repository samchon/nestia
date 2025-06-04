import { IHttpMigrateRoute } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";

import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateE2eFunctionProgrammer } from "./MigrateE2eFileProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiStartProgrammer {
  export const write = (
    context: INestiaMigrateContext,
  ): Record<string, string> => {
    const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
    const main: ts.VariableStatement = writeMain(
      context,
      importer,
      pick(context.routes),
    );
    const statements: ts.Statement[] = [
      ...importer.toStatements(
        (name) => `@ORGANIZATION/PROJECT-api/lib/structures/${name}`,
      ),
      FilePrinter.newLine(),
      ts.factory.createImportDeclaration(
        undefined,
        ts.factory.createImportClause(
          false,
          undefined,
          ts.factory.createNamedImports([
            ts.factory.createImportSpecifier(
              false,
              undefined,
              ts.factory.createIdentifier("TestGlobal"),
            ),
          ]),
        ),
        ts.factory.createStringLiteral("./TestGlobal"),
        undefined,
      ),
      FilePrinter.newLine(),
      main,
      ts.factory.createExpressionStatement(writeStarter()),
    ];
    return {
      "test/start.ts": FilePrinter.write({ statements }),
    };
  };

  const writeMain = (
    ctx: INestiaMigrateContext,
    importer: MigrateImportProgrammer,
    route: IHttpMigrateRoute,
  ): ts.VariableStatement =>
    StatementFactory.constant({
      name: "main",
      value: ts.factory.createArrowFunction(
        [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        undefined,
        ts.factory.createBlock(
          [
            writeConnection(ctx, importer),
            ...MigrateE2eFunctionProgrammer.writeBody({
              components: ctx.document.components,
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
    importer: MigrateImportProgrammer,
  ): ts.VariableStatement =>
    ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            "connection",
            undefined,
            ts.factory.createTypeReferenceNode(
              ts.factory.createQualifiedName(
                ts.factory.createIdentifier(
                  importer.external({
                    type: "default",
                    library: "@ORGANIZATION/PROJECT-api",
                    name: "api",
                  }),
                ),
                ts.factory.createIdentifier("IConnection"),
              ),
            ),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createSpreadAssignment(
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("TestGlobal"),
                      "connection",
                    ),
                    undefined,
                    undefined,
                  ),
                ),
                ...(ctx.document.servers?.[0]?.url?.length
                  ? [
                      ts.factory.createPropertyAssignment(
                        "host",
                        ts.factory.createStringLiteral(
                          ctx.document.servers[0].url,
                        ),
                      ),
                    ]
                  : []),
                ...(ctx.config.simulate === true
                  ? [
                      ts.factory.createPropertyAssignment(
                        "simulate",
                        ts.factory.createTrue(),
                      ),
                    ]
                  : []),
              ],
              true,
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

  const writeStarter = (): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createCallExpression(
          ts.factory.createIdentifier("main"),
          undefined,
          undefined,
        ),
        "catch",
      ),
      undefined,
      [
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [IdentifierFactory.parameter("exp")],
          undefined,
          undefined,
          ts.factory.createBlock(
            [
              ts.factory.createExpressionStatement(
                ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("console"),
                    "log",
                  ),
                  undefined,
                  [ts.factory.createIdentifier("exp")],
                ),
              ),
              ts.factory.createExpressionStatement(
                ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("process"),
                    "exit",
                  ),
                  undefined,
                  [
                    ts.factory.createPrefixMinus(
                      ts.factory.createNumericLiteral("1"),
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
  return array[index];
};
