import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateE2eFunctionProgrammer {
  export interface IContext {
    components: OpenApi.IComponents;
    importer: MigrateImportProgrammer;
    route: IHttpMigrateRoute;
  }

  export const write = (ctx: IContext): ts.FunctionDeclaration =>
    ts.factory.createFunctionDeclaration(
      [
        ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
        ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
      ],
      undefined,
      ["test", "api", ...ctx.route.accessor].join("_"),
      undefined,
      [
        IdentifierFactory.parameter(
          "connection",
          ts.factory.createTypeReferenceNode(
            ts.factory.createQualifiedName(
              ts.factory.createIdentifier(
                ctx.importer.external({
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
      ts.factory.createBlock(writeBody(ctx), true),
    );

  export const writeBody = (ctx: IContext): ts.Statement[] => [
    ts.factory.createVariableStatement(
      [],
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            "output",
            undefined,
            ctx.route.success
              ? MigrateSchemaProgrammer.write({
                  components: ctx.components,
                  importer: ctx.importer,
                  schema: ctx.route.success.schema,
                })
              : undefined,
            ts.factory.createAwaitExpression(writeCallExpressionn(ctx)),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier(
            ctx.importer.external({
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

  const writeCallExpressionn = (ctx: IContext): ts.CallExpression =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier("api.functional"),
        ts.factory.createIdentifier(ctx.route.accessor.join(".")),
      ),
      undefined,
      [
        ts.factory.createIdentifier("connection"),
        ...[...ctx.route.parameters, ctx.route.query!, ctx.route.body!]
          .filter((p) => !!p)
          .map((p) =>
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(
                  ctx.importer.external({
                    type: "default",
                    library: "typia",
                    name: "typia",
                  }),
                ),
                "random",
              ),
              [
                MigrateSchemaProgrammer.write({
                  components: ctx.components,
                  importer: ctx.importer,
                  schema: p.schema,
                }),
              ],
              undefined,
            ),
          ),
      ],
    );
}
