import { TypeScriptFactory } from "@nestia/factory";
import { IdentifierFactory, StatementFactory, TypeFactory } from "@typia/core";
import { IHttpMigrateRoute } from "@typia/interface";
import ts from "typescript";
import { OpenApi } from "typia";

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
      TypeScriptFactory.createArrowFunction(
        undefined,
        undefined,
        [],
        output,
        undefined,
        TypeScriptFactory.createCallExpression(
          IdentifierFactory.access(
            TypeScriptFactory.createIdentifier(
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
      TypeScriptFactory.createCallExpression(
        TypeScriptFactory.createIdentifier("random"),
        undefined,
        undefined,
      );
    return constant(
      "simulate",
      TypeScriptFactory.createArrowFunction(
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
        TypeScriptFactory.createTypeReferenceNode(
          ctx.route.success ? "Response" : "void",
        ),
        undefined,
        TypeScriptFactory.createBlock(
          [...assert(ctx), TypeScriptFactory.createReturnStatement(caller())],
          true,
        ),
      ),
    );
  };

  const assert = (ctx: IContext): ts.Statement[] => {
    const property = (key: string) =>
      ctx.config.keyword === true
        ? IdentifierFactory.access(
            TypeScriptFactory.createIdentifier("props"),
            key,
          )
        : TypeScriptFactory.createIdentifier(key);
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
      value: TypeScriptFactory.createCallExpression(
        IdentifierFactory.access(
          TypeScriptFactory.createIdentifier(
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
          TypeScriptFactory.createObjectLiteralExpression(
            [
              TypeScriptFactory.createPropertyAssignment(
                "method",
                TypeScriptFactory.createIdentifier("METADATA.method"),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "host",
                TypeScriptFactory.createIdentifier("connection.host"),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "path",
                NestiaMigrateApiNamespaceProgrammer.writePathCallExpression(
                  ctx.config,
                  ctx.route,
                ),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "contentType",
                TypeScriptFactory.createStringLiteral(
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
        TypeScriptFactory.createCallExpression(
          (() => {
            const base = IdentifierFactory.access(
              TypeScriptFactory.createIdentifier("assert"),
              p.category,
            );
            if (p.category !== "param") return base;
            return TypeScriptFactory.createCallExpression(base, undefined, [
              TypeScriptFactory.createStringLiteral(p.name),
            ]);
          })(),
          undefined,
          [
            TypeScriptFactory.createArrowFunction(
              undefined,
              undefined,
              [],
              undefined,
              undefined,
              TypeScriptFactory.createCallExpression(
                IdentifierFactory.access(
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
                [
                  p.category === "headers"
                    ? TypeScriptFactory.createIdentifier("connection.headers")
                    : property(p.name),
                ],
              ),
            ),
          ],
        ),
      )
      .map(TypeScriptFactory.createExpressionStatement) as ts.Statement[];
    return [validator, tryAndCatch(ctx.importer, individual)];
  };

  const tryAndCatch = (
    importer: NestiaMigrateImportProgrammer,
    individual: ts.Statement[],
  ) =>
    TypeScriptFactory.createTryStatement(
      TypeScriptFactory.createBlock(individual, true),
      TypeScriptFactory.createCatchClause(
        "exp",
        TypeScriptFactory.createBlock(
          [
            TypeScriptFactory.createIfStatement(
              TypeScriptFactory.createLogicalNot(
                TypeScriptFactory.createCallExpression(
                  IdentifierFactory.access(
                    TypeScriptFactory.createIdentifier(
                      importer.external({
                        type: "default",
                        library: "typia",
                        name: "typia",
                      }),
                    ),
                    "is",
                  ),
                  [
                    TypeScriptFactory.createTypeReferenceNode(
                      importer.external({
                        type: "instance",
                        library: "@nestia/fetcher",
                        name: "HttpError",
                      }),
                    ),
                  ],
                  [TypeScriptFactory.createIdentifier("exp")],
                ),
              ),
              TypeScriptFactory.createThrowStatement(
                TypeScriptFactory.createIdentifier("exp"),
              ),
            ),
            TypeScriptFactory.createReturnStatement(
              TypeScriptFactory.createAsExpression(
                TypeScriptFactory.createObjectLiteralExpression(
                  [
                    TypeScriptFactory.createPropertyAssignment(
                      "success",
                      TypeScriptFactory.createFalse(),
                    ),
                    TypeScriptFactory.createPropertyAssignment(
                      "status",
                      TypeScriptFactory.createIdentifier("exp.status"),
                    ),
                    TypeScriptFactory.createPropertyAssignment(
                      "headers",
                      TypeScriptFactory.createIdentifier("exp.headers"),
                    ),
                    TypeScriptFactory.createPropertyAssignment(
                      "data",
                      TypeScriptFactory.createIdentifier(
                        "exp.toJSON().message",
                      ),
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
  TypeScriptFactory.createVariableStatement(
    [TypeScriptFactory.createModifier(ts.SyntaxKind.ExportKeyword)],
    TypeScriptFactory.createVariableDeclarationList(
      [
        TypeScriptFactory.createVariableDeclaration(
          TypeScriptFactory.createIdentifier(name),
          undefined,
          undefined,
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
