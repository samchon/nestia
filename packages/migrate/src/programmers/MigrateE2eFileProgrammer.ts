import { OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { IHttpMigrateRoute } from "../structures/IHttpMigrateRoute";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateE2eFunctionProgrammer {
  export const write =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.FunctionDeclaration =>
      ts.factory.createFunctionDeclaration(
        [
          ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
          ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
        ],
        undefined,
        ["test", "api", ...route.accessor].join("_"),
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
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
          ),
        ],
        undefined,
        ts.factory.createBlock(writeBody(components)(importer)(route), true),
      );

  export const writeBody =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.Statement[] => [
      ts.factory.createVariableStatement(
        [],
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              "output",
              undefined,
              route.success
                ? MigrateSchemaProgrammer.write(components)(importer)(
                    route.success.schema,
                  )
                : undefined,
              ts.factory.createAwaitExpression(
                writeCallExpressionn(components)(importer)(route),
              ),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      ),
      ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(
              importer.external({
                type: "default",
                library: "typia",
                name: "typia",
              }),
            ),
            "assert",
          ),
          undefined,
          [ts.factory.createIdentifier("output")],
        ),
      ),
    ];

  const writeCallExpressionn =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.CallExpression =>
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("api.functional"),
          ts.factory.createIdentifier(route.accessor.join(".")),
        ),
        undefined,
        [
          ts.factory.createIdentifier("connection"),
          ...[...route.parameters, route.query!, route.body!]
            .filter((p) => !!p)
            .map((p) =>
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier(
                    importer.external({
                      type: "default",
                      library: "typia",
                      name: "typia",
                    }),
                  ),
                  "random",
                ),
                [MigrateSchemaProgrammer.write(components)(importer)(p.schema)],
                undefined,
              ),
            ),
        ],
      );
}
