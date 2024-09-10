import { OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";

import { IHttpMigrateFile } from "../structures/IHttpMigrateFile";
import { IHttpMigrateProgram } from "../structures/IHttpMigrateProgram";
import { IHttpMigrateRoute } from "../structures/IHttpMigrateRoute";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateE2eFunctionProgrammer } from "./MigrateE2eFileProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";

export namespace MigrateApiStartProgrammer {
  export const write = (program: IHttpMigrateProgram): IHttpMigrateFile => {
    const importer: MigrateImportProgrammer = new MigrateImportProgrammer();
    const main: ts.VariableStatement = writeMain(program)(program.document)(
      importer,
    )(pick(program.routes));
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
      location: `test`,
      file: "start.ts",
      content: FilePrinter.write({ statements }),
    };
  };

  const writeMain =
    (config: IHttpMigrateProgram.IConfig) =>
    (document: OpenApi.IDocument) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.VariableStatement =>
      StatementFactory.constant(
        "main",
        ts.factory.createArrowFunction(
          [ts.factory.createToken(ts.SyntaxKind.AsyncKeyword)],
          undefined,
          [],
          undefined,
          undefined,
          ts.factory.createBlock(
            [
              writeConnection(config)(document)(importer),
              ...MigrateE2eFunctionProgrammer.writeBody(document.components)(
                importer,
              )(route),
            ],
            true,
          ),
        ),
      );

  const writeConnection =
    (config: IHttpMigrateProgram.IConfig) =>
    (document: OpenApi.IDocument) =>
    (importer: MigrateImportProgrammer): ts.VariableStatement =>
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
                  ...(document.servers?.[0]?.url?.length
                    ? [
                        ts.factory.createPropertyAssignment(
                          "host",
                          ts.factory.createStringLiteral(
                            document.servers[0].url,
                          ),
                        ),
                      ]
                    : []),
                  ...(config.simulate === true
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
