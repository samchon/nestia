import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";
import { IHttpMigrateRoute } from "@typia/interface";

import { IdentifierFactory } from "../factories/IdentifierFactory";
import { StatementFactory } from "../factories/StatementFactory";
import ts from "../internal/ts";
import { INestiaMigrateContext } from "../structures/INestiaMigrateContext";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateE2eFunctionProgrammer } from "./NestiaMigrateE2eFileProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";

/**
 * Generates the `test/start.ts` of an SDK project: a small program that calls
 * one API function.
 *
 * @evidence contracts/common.md#principled-implementation The program builds a connection from the global test settings and the first server of the document, adds the simulate flag when requested, and calls the first route the way the generated e2e tests do, so one command can check that the SDK and a server agree.
 * @evidence contracts/common.md#clear-and-simple-design One entry function and private helpers for the connection, the main function, and the starter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The route is the first one, so the same document always generates the same file.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateApiStartProgrammer {
  /**
   * Returns the `test/start.ts` file of an SDK project.
   *
   * @evidence contracts/common.md#principled-implementation The file imports what the body uses, defines `main`, and starts it, exiting with a failure status when it rejects.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The content derives from the document.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
  export const write = (
    context: INestiaMigrateContext,
  ): Record<string, string> => {
    const importer: NestiaMigrateImportProgrammer =
      new NestiaMigrateImportProgrammer();
    // the first route, so the same document always generates the same file
    const route: IHttpMigrateRoute | undefined = context.application.routes[0];
    const main: ts.VariableStatement = writeMain(context, importer, route);
    const statements: ts.Statement[] = [
      ...importer.toStatements(
        (name) => `@ORGANIZATION/PROJECT-api/lib/structures/${name}`,
      ),
      FilePrinter.newLine(),
      ...(route === undefined
        ? []
        : [
            factory.createImportDeclaration(
              undefined,
              factory.createImportClause(
                undefined,
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
          ]),
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
    route: IHttpMigrateRoute | undefined,
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
            ...(route === undefined
              ? []
              : [
                  writeConnection(ctx, importer),
                  ...NestiaMigrateE2eFunctionProgrammer.writeBody({
                    config: ctx.config,
                    components: ctx.application.document().components,
                    importer,
                    route,
                  }),
                ]),
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
