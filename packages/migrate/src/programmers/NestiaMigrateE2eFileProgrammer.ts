import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateSchemaProgrammer } from "./NestiaMigrateSchemaProgrammer";

export namespace NestiaMigrateE2eFunctionProgrammer {
  export interface IContext {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
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
              ? NestiaMigrateSchemaProgrammer.write({
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

  const writeCallExpressionn = (ctx: IContext): ts.CallExpression => {
    const fetch = ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier("api.functional"),
      ts.factory.createIdentifier(ctx.route.accessor.join(".")),
    );
    const connection = ts.factory.createIdentifier("connection");
    if (
      ctx.route.parameters.length === 0 &&
      ctx.route.query === null &&
      ctx.route.body === null
    )
      return ts.factory.createCallExpression(fetch, undefined, [connection]);

    const random = ts.factory.createPropertyAccessExpression(
      ts.factory.createIdentifier(
        ctx.importer.external({
          type: "default",
          library: "typia",
          name: "typia",
        }),
      ),
      "random",
    );
    if (ctx.config.keyword === true)
      return ts.factory.createCallExpression(fetch, undefined, [
        connection,
        LiteralFactory.write(
          Object.fromEntries(
            [...ctx.route.parameters, ctx.route.query, ctx.route.body]
              .filter((x) => x !== null)
              .map(({ key, schema: value }) => [
                key,
                ts.factory.createCallExpression(
                  random,
                  [
                    NestiaMigrateSchemaProgrammer.write({
                      components: ctx.components,
                      importer: ctx.importer,
                      schema: value,
                    }),
                  ],
                  undefined,
                ),
              ]),
          ),
        ),
      ]);
    return ts.factory.createCallExpression(fetch, undefined, [
      connection,
      ...[...ctx.route.parameters, ctx.route.query, ctx.route.body]
        .filter((p) => !!p)
        .map((p) =>
          ts.factory.createCallExpression(
            random,
            [
              NestiaMigrateSchemaProgrammer.write({
                components: ctx.components,
                importer: ctx.importer,
                schema: p.schema,
              }),
            ],
            undefined,
          ),
        ),
    ]);
  };
}
