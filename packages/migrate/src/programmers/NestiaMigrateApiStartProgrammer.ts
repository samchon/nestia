import { TypeScriptFactory } from "@nestia/factory";
import { IdentifierFactory, StatementFactory } from "@nestia/factory";
import { IHttpMigrateRoute } from "@typia/interface";
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
      TypeScriptFactory.createImportDeclaration(
        undefined,
        TypeScriptFactory.createImportClause(
          false,
          undefined,
          TypeScriptFactory.createNamedImports([
            TypeScriptFactory.createImportSpecifier(
              false,
              undefined,
              TypeScriptFactory.createIdentifier("TestGlobal"),
            ),
          ]),
        ),
        TypeScriptFactory.createStringLiteral("./TestGlobal"),
        undefined,
      ),
      FilePrinter.newLine(),
      main,
      TypeScriptFactory.createExpressionStatement(writeStarter()),
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
      value: TypeScriptFactory.createArrowFunction(
        [TypeScriptFactory.createToken(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        [],
        undefined,
        undefined,
        TypeScriptFactory.createBlock(
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
    TypeScriptFactory.createVariableStatement(
      undefined,
      TypeScriptFactory.createVariableDeclarationList(
        [
          TypeScriptFactory.createVariableDeclaration(
            "connection",
            undefined,
            TypeScriptFactory.createTypeReferenceNode(
              TypeScriptFactory.createQualifiedName(
                TypeScriptFactory.createIdentifier(
                  importer.external({
                    type: "default",
                    library: "@ORGANIZATION/PROJECT-api",
                    name: "api",
                  }),
                ),
                TypeScriptFactory.createIdentifier("IConnection"),
              ),
            ),
            TypeScriptFactory.createObjectLiteralExpression(
              [
                TypeScriptFactory.createSpreadAssignment(
                  TypeScriptFactory.createCallExpression(
                    TypeScriptFactory.createPropertyAccessExpression(
                      TypeScriptFactory.createIdentifier("TestGlobal"),
                      "connection",
                    ),
                    undefined,
                    undefined,
                  ),
                ),
                ...(ctx.application.document().servers?.[0]?.url?.length
                  ? [
                      TypeScriptFactory.createPropertyAssignment(
                        "host",
                        TypeScriptFactory.createStringLiteral(
                          ctx.application.document().servers![0]!.url,
                        ),
                      ),
                    ]
                  : []),
                ...(ctx.config.simulate === true
                  ? [
                      TypeScriptFactory.createPropertyAssignment(
                        "simulate",
                        TypeScriptFactory.createTrue(),
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
    TypeScriptFactory.createCallExpression(
      TypeScriptFactory.createPropertyAccessExpression(
        TypeScriptFactory.createCallExpression(
          TypeScriptFactory.createIdentifier("main"),
          undefined,
          undefined,
        ),
        "catch",
      ),
      undefined,
      [
        TypeScriptFactory.createArrowFunction(
          undefined,
          undefined,
          [IdentifierFactory.parameter("exp")],
          undefined,
          undefined,
          TypeScriptFactory.createBlock(
            [
              TypeScriptFactory.createExpressionStatement(
                TypeScriptFactory.createCallExpression(
                  TypeScriptFactory.createPropertyAccessExpression(
                    TypeScriptFactory.createIdentifier("console"),
                    "log",
                  ),
                  undefined,
                  [TypeScriptFactory.createIdentifier("exp")],
                ),
              ),
              TypeScriptFactory.createExpressionStatement(
                TypeScriptFactory.createCallExpression(
                  TypeScriptFactory.createPropertyAccessExpression(
                    TypeScriptFactory.createIdentifier("process"),
                    "exit",
                  ),
                  undefined,
                  [
                    TypeScriptFactory.createPrefixMinus(
                      TypeScriptFactory.createNumericLiteral("1"),
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
