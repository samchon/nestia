import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";
import { IHttpMigrateRoute } from "@typia/interface";
import { OpenApi } from "typia";

import { IdentifierFactory } from "../factories/IdentifierFactory";
import { StatementFactory } from "../factories/StatementFactory";
import { TypeFactory } from "../factories/TypeFactory";
import ts from "../internal/ts";
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
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        output,
        undefined,
        factory.createCallExpression(
          IdentifierFactory.access(
            factory.createIdentifier(
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
      factory.createCallExpression(
        factory.createIdentifier("random"),
        undefined,
        undefined,
      );
    return constant(
      "simulate",
      factory.createArrowFunction(
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
        factory.createTypeReferenceNode(
          ctx.route.success ? "Response" : "void",
        ),
        undefined,
        factory.createBlock(
          [...assert(ctx), factory.createReturnStatement(caller())],
          true,
        ),
      ),
    );
  };

  const assert = (ctx: IContext): ts.Statement[] => {
    const property = (key: string) =>
      ctx.config.keyword === true
        ? IdentifierFactory.access(factory.createIdentifier("props"), key)
        : factory.createIdentifier(key);
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
      value: factory.createCallExpression(
        IdentifierFactory.access(
          factory.createIdentifier(
            ctx.importer.external({
              type: "instance",
              library: `@nestia/fetcher`,
              name: "NestiaSimulator",
            }),
          ),
          "assert",
        ),
        undefined,
        [
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                "method",
                factory.createIdentifier("METADATA.method"),
              ),
              factory.createPropertyAssignment(
                "host",
                factory.createIdentifier("connection.host"),
              ),
              factory.createPropertyAssignment(
                "path",
                NestiaMigrateApiNamespaceProgrammer.writePathCallExpression(
                  ctx.config,
                  ctx.route,
                ),
              ),
              factory.createPropertyAssignment(
                "contentType",
                factory.createStringLiteral(
                  ctx.route.success?.type ?? "application/json",
                ),
              ),
            ],
            true,
          ),
        ],
      ),
    });
    const individual: ts.Statement[] = parameters
      .map((p) =>
        factory.createCallExpression(
          (() => {
            const base = IdentifierFactory.access(
              factory.createIdentifier("assert"),
              p.category,
            );
            if (p.category !== "param") return base;
            return factory.createCallExpression(base, undefined, [
              factory.createStringLiteral(p.name),
            ]);
          })(),
          undefined,
          [
            factory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              undefined,
              factory.createCallExpression(
                IdentifierFactory.access(
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
                [
                  p.category === "headers"
                    ? factory.createIdentifier("connection.headers")
                    : property(p.name),
                ],
              ),
            ),
          ],
        ),
      )
      .map(factory.createExpressionStatement) as ts.Statement[];
    return [validator, tryAndCatch(ctx.importer, individual)];
  };

  const tryAndCatch = (
    importer: NestiaMigrateImportProgrammer,
    individual: ts.Statement[],
  ) =>
    factory.createTryStatement(
      factory.createBlock(individual, true),
      factory.createCatchClause(
        "exp",
        factory.createBlock(
          [
            factory.createIfStatement(
              factory.createLogicalNot(
                factory.createCallExpression(
                  IdentifierFactory.access(
                    factory.createIdentifier(
                      importer.external({
                        type: "default",
                        library: "typia",
                        name: "typia",
                      }),
                    ),
                    "is",
                  ),
                  [
                    factory.createTypeReferenceNode(
                      importer.external({
                        type: "instance",
                        library: "@nestia/fetcher",
                        name: "HttpError",
                      }),
                    ),
                  ],
                  [factory.createIdentifier("exp")],
                ),
              ),
              factory.createThrowStatement(factory.createIdentifier("exp")),
            ),
            factory.createReturnStatement(
              factory.createAsExpression(
                factory.createObjectLiteralExpression(
                  [
                    factory.createPropertyAssignment(
                      "success",
                      factory.createFalse(),
                    ),
                    factory.createPropertyAssignment(
                      "status",
                      factory.createIdentifier("exp.status"),
                    ),
                    factory.createPropertyAssignment(
                      "headers",
                      factory.createIdentifier("exp.headers"),
                    ),
                    factory.createPropertyAssignment(
                      "data",
                      factory.createIdentifier("exp.toJSON().message"),
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
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );
