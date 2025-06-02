import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { MigrateApiFunctionProgrammer } from "./MigrateApiFunctionProgrammer";
import { MigrateApiNamespaceProgrammer } from "./MigrateApiNamespaceProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateApiSimulationProgrammer {
  export interface IContext {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    importer: MigrateImportProgrammer;
    route: IHttpMigrateRoute;
  }

  export const random = (ctx: IContext) => {
    const output = ctx.route.success
      ? MigrateSchemaProgrammer.write({
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
        [
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            "g",
            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            ts.factory.createTypeReferenceNode(
              ts.factory.createIdentifier("Partial"),
              [
                ts.factory.createTypeReferenceNode(
                  `${ctx.importer.external({
                    type: "default",
                    library: "typia",
                    name: "typia",
                  })}.IRandomGenerator`,
                ),
              ],
            ),
          ),
        ],
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
          [ts.factory.createIdentifier("g")],
        ),
      ),
    );
  };

  export const simulate = (ctx: IContext): ts.VariableStatement => {
    const caller = () =>
      ts.factory.createCallExpression(
        ts.factory.createIdentifier("random"),
        undefined,
        [
          ts.factory.createConditionalExpression(
            ts.factory.createLogicalAnd(
              ts.factory.createStrictEquality(
                ts.factory.createStringLiteral("object"),
                ts.factory.createTypeOfExpression(
                  ts.factory.createIdentifier("connection.simulate"),
                ),
              ),
              ts.factory.createStrictInequality(
                ts.factory.createNull(),
                ts.factory.createIdentifier("connection.simulate"),
              ),
            ),
            undefined,
            ts.factory.createIdentifier("connection.simulate"),
            undefined,
            ts.factory.createIdentifier("undefined"),
          ),
        ],
      );
    return constant(
      "simulate",
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        MigrateApiFunctionProgrammer.writeParameterDeclarations(ctx),
        ts.factory.createTypeReferenceNode(
          ctx.route.success ? "Output" : "void",
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
    const parameters = [
      ...ctx.route.parameters.map((p) => ({
        category: "param",
        name: p.key,
        schema: MigrateSchemaProgrammer.write({
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
              schema: MigrateSchemaProgrammer.write({
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
              schema: MigrateSchemaProgrammer.write({
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
                MigrateApiNamespaceProgrammer.writePathCallExpression(
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
                  ts.factory.createIdentifier(
                    p.category === "headers" ? "connection.headers" : p.name,
                  ),
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
    importer: MigrateImportProgrammer,
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
