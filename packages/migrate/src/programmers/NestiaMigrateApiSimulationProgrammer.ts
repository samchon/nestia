import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { NestiaMigrateApiFunctionProgrammer } from "./NestiaMigrateApiFunctionProgrammer";
import { NestiaMigrateApiNamespaceProgrammer } from "./NestiaMigrateApiNamespaceProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateSchemaProgrammer } from "./NestiaMigrateSchemaProgrammer";

export namespace NestiaMigrateApiSimulationProgrammer {
  export interface IContext {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    route: IHttpMigrateRoute;
  }

  export const random = (ctx: IContext) => {
    const output = ctx.route.success
      ? NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.success.schema,
        })
      : TypeFactory.keyword("void");
    return constant(
      "random",
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        output,
        undefined,
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              ctx.importer.external({
                type: "default",
                library: "typia",
                name: "typia",
              }),
            ),
            "random",
          ),
          [output],
          undefined,
        ),
      ),
    );
  };

  export const simulate = (ctx: IContext): ts.VariableStatement => {
    const caller = () =>
      ts.factory.createCallExpression(
        ts.factory.createIdentifier("random"),
        undefined,
        undefined,
      );
    return constant(
      "simulate",
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        NestiaMigrateApiFunctionProgrammer.writeParameterDeclarations(
          ctx,
          ctx.route.parameters.length === 0 &&
            ctx.route.query === null &&
            ctx.route.body === null
            ? "_connection"
            : undefined,
        ),
        ts.factory.createTypeReferenceNode(
          ctx.route.success ? "Response" : "void",
        ),
        undefined,
        ts.factory.createBlock(
          [...assert(ctx), ts.factory.createReturnStatement(caller())],
          true,
        ),
      ),
    );
  };

  const assert = (ctx: IContext): ts.Statement[] => {
    const property = (key: string) =>
      ctx.config.keyword === true
        ? IdentifierFactory.access(ts.factory.createIdentifier("props"), key)
        : ts.factory.createIdentifier(key);
    const parameters = [
      ...ctx.route.parameters.map((p) => ({
        category: "param",
        name: p.key,
        schema: NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: p.schema,
        }),
      })),
      ...(ctx.route.query
        ? [
            {
              category: "query",
              name: ctx.route.query.key,
              schema: NestiaMigrateSchemaProgrammer.write({
                components: ctx.components,
                importer: ctx.importer,
                schema: ctx.route.query.schema,
              }),
            },
          ]
        : []),
      ...(ctx.route.body
        ? [
            {
              category: "body",
              name: ctx.route.body.key,
              schema: NestiaMigrateSchemaProgrammer.write({
                components: ctx.components,
                importer: ctx.importer,
                schema: ctx.route.body.schema,
              }),
            },
          ]
        : []),
    ];
    if (parameters.length === 0) return [];

    const validator = StatementFactory.constant({
      name: "assert",
      value: ts.factory.createCallExpression(
        IdentifierFactory.access(
          ts.factory.createIdentifier(
            ctx.importer.external({
              type: "instance",
              library: `@nestia/fetcher/lib/NestiaSimulator`,
              name: "NestiaSimulator",
            }),
          ),
          "assert",
        ),
        undefined,
        [
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                "method",
                ts.factory.createIdentifier("METADATA.method"),
              ),
              ts.factory.createPropertyAssignment(
                "host",
                ts.factory.createIdentifier("connection.host"),
              ),
              ts.factory.createPropertyAssignment(
                "path",
                NestiaMigrateApiNamespaceProgrammer.writePathCallExpression(
                  ctx.config,
                  ctx.route,
                ),
              ),
              ts.factory.createPropertyAssignment(
                "contentType",
                ts.factory.createStringLiteral(
                  ctx.route.success?.type ?? "application/json",
                ),
              ),
            ],
            true,
          ),
        ],
      ),
    });
    const individual = parameters
      .map((p) =>
        ts.factory.createCallExpression(
          (() => {
            const base = IdentifierFactory.access(
              ts.factory.createIdentifier("assert"),
              p.category,
            );
            if (p.category !== "param") return base;
            return ts.factory.createCallExpression(base, undefined, [
              ts.factory.createStringLiteral(p.name),
            ]);
          })(),
          undefined,
          [
            ts.factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              undefined,
              ts.factory.createCallExpression(
                IdentifierFactory.access(
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
                [
                  p.category === "headers"
                    ? ts.factory.createIdentifier("connection.headers")
                    : property(p.name),
                ],
              ),
            ),
          ],
        ),
      )
      .map(ts.factory.createExpressionStatement);
    return [validator, tryAndCatch(ctx.importer, individual)];
  };

  const tryAndCatch = (
    importer: NestiaMigrateImportProgrammer,
    individual: ts.Statement[],
  ) =>
    ts.factory.createTryStatement(
      ts.factory.createBlock(individual, true),
      ts.factory.createCatchClause(
        "exp",
        ts.factory.createBlock(
          [
            ts.factory.createIfStatement(
              ts.factory.createLogicalNot(
                ts.factory.createCallExpression(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(
                      importer.external({
                        type: "default",
                        library: "typia",
                        name: "typia",
                      }),
                    ),
                    "is",
                  ),
                  [
                    ts.factory.createTypeReferenceNode(
                      importer.external({
                        type: "instance",
                        library: "@nestia/fetcher",
                        name: "HttpError",
                      }),
                    ),
                  ],
                  [ts.factory.createIdentifier("exp")],
                ),
              ),
              ts.factory.createThrowStatement(
                ts.factory.createIdentifier("exp"),
              ),
            ),
            ts.factory.createReturnStatement(
              ts.factory.createAsExpression(
                ts.factory.createObjectLiteralExpression(
                  [
                    ts.factory.createPropertyAssignment(
                      "success",
                      ts.factory.createFalse(),
                    ),
                    ts.factory.createPropertyAssignment(
                      "status",
                      ts.factory.createIdentifier("exp.status"),
                    ),
                    ts.factory.createPropertyAssignment(
                      "headers",
                      ts.factory.createIdentifier("exp.headers"),
                    ),
                    ts.factory.createPropertyAssignment(
                      "data",
                      ts.factory.createIdentifier("exp.toJSON().message"),
                    ),
                  ],
                  true,
                ),
                TypeFactory.keyword("any"),
              ),
            ),
          ],
          true,
        ),
      ),
      undefined,
    );
}

const constant = (name: string, expression: ts.Expression) =>
  ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(name),
          undefined,
          undefined,
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
