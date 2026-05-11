import { TypeScriptFactory } from "@nestia/factory";
import { IdentifierFactory, LiteralFactory } from "@typia/core";
import { IHttpMigrateRoute } from "@typia/interface";
import ts from "typescript";
import { OpenApi } from "typia";

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
    TypeScriptFactory.createFunctionDeclaration(
      [
        TypeScriptFactory.createModifier(ts.SyntaxKind.ExportKeyword),
        TypeScriptFactory.createModifier(ts.SyntaxKind.AsyncKeyword),
      ],
      undefined,
      ["test", "api", ...ctx.route.accessor].join("_"),
      undefined,
      [
        IdentifierFactory.parameter(
          "connection",
          TypeScriptFactory.createTypeReferenceNode(
            TypeScriptFactory.createQualifiedName(
              TypeScriptFactory.createIdentifier(
                ctx.importer.external({
                  type: "default",
                  library: "@ORGANIZATION/PROJECT-api",
                  name: "api",
                }),
              ),
              TypeScriptFactory.createIdentifier("IConnection"),
            ),
          ),
        ),
      ],
      undefined,
      TypeScriptFactory.createBlock(writeBody(ctx), true),
    );

  export const writeBody = (ctx: IContext): ts.Statement[] => [
    TypeScriptFactory.createVariableStatement(
      [],
      TypeScriptFactory.createVariableDeclarationList(
        [
          TypeScriptFactory.createVariableDeclaration(
            "output",
            undefined,
            ctx.route.success
              ? NestiaMigrateSchemaProgrammer.write({
                  components: ctx.components,
                  importer: ctx.importer,
                  schema: ctx.route.success.schema,
                })
              : undefined,
            TypeScriptFactory.createAwaitExpression(writeCallExpressionn(ctx)),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    ),
    TypeScriptFactory.createExpressionStatement(
      TypeScriptFactory.createCallExpression(
        TypeScriptFactory.createPropertyAccessExpression(
          TypeScriptFactory.createIdentifier(
            ctx.importer.external({
              type: "default",
              library: "typia",
              name: "typia",
            }),
          ),
          "assert",
        ),
        undefined,
        [TypeScriptFactory.createIdentifier("output")],
      ),
    ),
  ];

  const writeCallExpressionn = (ctx: IContext): ts.CallExpression => {
    const fetch = TypeScriptFactory.createPropertyAccessExpression(
      TypeScriptFactory.createIdentifier("api.functional"),
      TypeScriptFactory.createIdentifier(ctx.route.accessor.join(".")),
    );
    const connection = TypeScriptFactory.createIdentifier("connection");
    if (
      ctx.route.parameters.length === 0 &&
      ctx.route.query === null &&
      ctx.route.body === null
    )
      return TypeScriptFactory.createCallExpression(fetch, undefined, [
        connection,
      ]);

    const random = TypeScriptFactory.createPropertyAccessExpression(
      TypeScriptFactory.createIdentifier(
        ctx.importer.external({
          type: "default",
          library: "typia",
          name: "typia",
        }),
      ),
      "random",
    );
    if (ctx.config.keyword === true)
      return TypeScriptFactory.createCallExpression(fetch, undefined, [
        connection,
        LiteralFactory.write(
          Object.fromEntries(
            [...ctx.route.parameters, ctx.route.query, ctx.route.body]
              .filter((x) => x !== null)
              .map(({ key, schema: value }) => [
                key,
                TypeScriptFactory.createCallExpression(
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
    return TypeScriptFactory.createCallExpression(fetch, undefined, [
      connection,
      ...[...ctx.route.parameters, ctx.route.query, ctx.route.body]
        .filter((p) => !!p)
        .map((p) =>
          TypeScriptFactory.createCallExpression(
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
