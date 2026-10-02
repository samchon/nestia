import { NodeFlags, SyntaxKind, factory } from "@ttsc/factory";
import { IHttpMigrateRoute } from "@typia/interface";
import { OpenApi } from "typia";

import { IdentifierFactory } from "../factories/IdentifierFactory";
import { LiteralFactory } from "../factories/LiteralFactory";
import ts from "../internal/ts";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateSchemaProgrammer } from "./NestiaMigrateSchemaProgrammer";

/**
 * Generates the e2e test function of one route.
 *
 * @evidence contracts/common.md#principled-implementation The function calls the route through the SDK with random arguments made by `typia.random`, including generated headers, and asserts the response with `typia.assert`, so the test checks that the server's answer matches the declared type.
 * @evidence contracts/common.md#clear-and-simple-design One entry function, one public body writer shared with the start programmer, and a private call writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The arguments are drawn at run time, and no route is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is generated.
 */
export namespace NestiaMigrateE2eFunctionProgrammer {
  /**
   * The input of one test function: the configuration, the components, the
   * importer, and the route.
   *
   * @evidence contracts/common.md#principled-implementation The record holds exactly what the generation needs.
   * @evidence contracts/common.md#clear-and-simple-design A flat record.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment lists the fields.
   */
  export interface IContext {
    /** Calling convention and optional generated features for this operation. */
    config: INestiaMigrateConfig;

    /** Component schemas used to resolve DTO references. */
    components: OpenApi.IComponents;

    /** File-local import collector shared with the surrounding file writer. */
    importer: NestiaMigrateImportProgrammer;

    /** Analyzed operation, with the accessor chosen for this generation. */
    route: IHttpMigrateRoute;
  }

  /**
   * Returns the exported async test function of a route, named `test_api_`
   * followed by its accessor.
   *
   * @evidence contracts/common.md#principled-implementation The name joins `test`, `api`, and the accessor with underscores, so it is unique for a route and matches the prefix that the e2e executor discovers.
   * @evidence contracts/common.md#clear-and-simple-design One expression.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The name derives from the accessor.
   * @evidence contracts/common.md#meaningful-documentation The comment states the naming rule.
   */
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

  /**
   * Returns the statements of the test body: the call with random arguments and
   * the type assertion of its output.
   *
   * @evidence contracts/common.md#principled-implementation The call expression follows the parameter mode of the configuration, and the output is typed by the response schema when there is one.
   * @evidence contracts/common.md#clear-and-simple-design One function shared with the start programmer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The body follows the route.
   * @evidence contracts/common.md#meaningful-documentation The comment states the result.
   */
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
    // the route's headers travel in the connection, as the server requires
    const connection: ts.Expression = ctx.route.headers
      ? factory.createObjectLiteralExpression(
          [
            factory.createSpreadAssignment(
              factory.createIdentifier("connection"),
            ),
            factory.createPropertyAssignment(
              "headers",
              factory.createObjectLiteralExpression(
                [
                  factory.createSpreadAssignment(
                    factory.createIdentifier("connection.headers"),
                  ),
                  factory.createSpreadAssignment(
                    factory.createCallExpression(
                      random,
                      [
                        NestiaMigrateSchemaProgrammer.write({
                          components: ctx.components,
                          importer: ctx.importer,
                          schema: ctx.route.headers.schema,
                        }),
                      ],
                      undefined,
                    ),
                  ),
                ],
                true,
              ),
            ),
          ],
          true,
        )
      : factory.createIdentifier("connection");
    if (
      ctx.route.parameters.length === 0 &&
      ctx.route.query === null &&
      ctx.route.body === null
    )
      return factory.createCallExpression(fetch, undefined, [connection]);
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
