import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";
import { IHttpMigrateRoute } from "@typia/interface";
import { OpenApi } from "typia";

import { IdentifierFactory } from "../factories/IdentifierFactory";
import { LiteralFactory } from "../factories/LiteralFactory";
import ts from "../internal/ts";
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
    factory.createFunctionDeclaration(
      [
        factory.createModifier(SyntaxKind.ExportKeyword),
        factory.createModifier(SyntaxKind.AsyncKeyword),
      ],
      undefined,
      ["test", "api", ...ctx.route.accessor].join("_"),
      undefined,
      [
        IdentifierFactory.parameter(
          "connection",
          factory.createTypeReferenceNode(
            factory.createQualifiedName(
              factory.createIdentifier(
                ctx.importer.external({
                  type: "default",
                  library: "@ORGANIZATION/PROJECT-api",
                  name: "api",
                }),
              ),
              factory.createIdentifier("IConnection"),
            ),
          ),
        ),
      ],
      undefined,
      factory.createBlock(writeBody(ctx), true),
    );

  export const writeBody = (ctx: IContext): ts.Statement[] => [
    factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            "output",
            undefined,
            ctx.route.success
              ? NestiaMigrateSchemaProgrammer.write({
                  components: ctx.components,
                  importer: ctx.importer,
                  schema: ctx.route.success.schema,
                })
              : undefined,
            factory.createAwaitExpression(writeCallExpressionn(ctx)),
          ),
        ],
        NodeFlags.Const,
      ),
    ),
    factory.createExpressionStatement(
      factory.createCallExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(
            ctx.importer.external({
              type: "default",
              library: "typia",
              name: "typia",
            }),
          ),
          "assert",
        ),
        undefined,
        [factory.createIdentifier("output")],
      ),
    ),
  ];

  const writeCallExpressionn = (ctx: IContext): ts.CallExpression => {
    const fetch = factory.createPropertyAccessExpression(
      factory.createIdentifier("api.functional"),
      factory.createIdentifier(ctx.route.accessor.join(".")),
    );
    const connection = factory.createIdentifier("connection");
    if (
      ctx.route.parameters.length === 0 &&
      ctx.route.query === null &&
      ctx.route.body === null
    )
      return factory.createCallExpression(fetch, undefined, [connection]);

    const random = factory.createPropertyAccessExpression(
      factory.createIdentifier(
        ctx.importer.external({
          type: "default",
          library: "typia",
          name: "typia",
        }),
      ),
      "random",
    );
    if (ctx.config.keyword === true)
      return factory.createCallExpression(fetch, undefined, [
        connection,
        LiteralFactory.write(
          Object.fromEntries(
            [...ctx.route.parameters, ctx.route.query, ctx.route.body]
              .filter((x) => x !== null)
              .map(({ key, schema: value }) => [
                key,
                factory.createCallExpression(
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
    return factory.createCallExpression(fetch, undefined, [
      connection,
      ...[...ctx.route.parameters, ctx.route.query, ctx.route.body]
        .filter((p) => !!p)
        .map((p) =>
          factory.createCallExpression(
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
