import {
  type Block,
  type Expression,
  type ModuleDeclaration,
  NodeFlags,
  SyntaxKind,
  type TypeAliasDeclaration,
  type TypeNode,
  type VariableStatement,
  factory,
} from "@ttsc/factory";
import { IHttpMigrateRoute } from "@typia/interface";
import { OpenApi } from "typia";

import {
  ExpressionFactory,
  IdentifierFactory,
  LiteralFactory,
  TypeFactory,
} from "../factories";
import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { FilePrinter } from "../utils/FilePrinter";
import { NestiaMigrateApiSimulationProgrammer } from "./NestiaMigrateApiSimulationProgrammer";
import { NestiaMigrateImportProgrammer } from "./NestiaMigrateImportProgrammer";
import { NestiaMigrateSchemaProgrammer } from "./NestiaMigrateSchemaProgrammer";

export namespace NestiaMigrateApiNamespaceProgrammer {
  export interface IContext {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    importer: NestiaMigrateImportProgrammer;
    route: IHttpMigrateRoute;
  }

  export const write = (ctx: IContext): ModuleDeclaration => {
    const types: TypeAliasDeclaration[] = writeTypes(ctx);
    return factory.createModuleDeclaration(
      [factory.createToken(SyntaxKind.ExportKeyword)],
      factory.createIdentifier(ctx.route.accessor.at(-1)!),
      factory.createModuleBlock([
        ...types,
        ...(types.length ? [FilePrinter.newLine()] : []),
        writeMetadata(ctx),
        FilePrinter.newLine(),
        writePathFunction(ctx),
        ...(ctx.config.simulate === true
          ? [
              NestiaMigrateApiSimulationProgrammer.random(ctx),
              NestiaMigrateApiSimulationProgrammer.simulate(ctx),
            ]
          : []),
      ]),
      NodeFlags.Namespace,
    );
  };

  export const writePathCallExpression = (
    config: INestiaMigrateConfig,
    route: IHttpMigrateRoute,
  ) =>
    factory.createCallExpression(
      factory.createIdentifier(`${route.accessor.at(-1)!}.path`),
      undefined,
      route.parameters.length === 0 && route.query === null
        ? []
        : config.keyword === true
          ? [factory.createIdentifier("props")]
          : [...route.parameters, ...(route.query ? [route.query] : [])].map(
              (p) => factory.createIdentifier(p.key),
            ),
    );

  const writeTypes = (ctx: IContext): TypeAliasDeclaration[] => {
    const array: TypeAliasDeclaration[] = [];
    const declare = (name: string, type: TypeNode) =>
      array.push(
        factory.createTypeAliasDeclaration(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          name,
          undefined,
          type,
        ),
      );
    if (
      ctx.config.keyword === true &&
      (ctx.route.parameters.length > 0 || ctx.route.query || ctx.route.body)
    )
      declare(
        "Props",
        NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: {
            type: "object",
            properties: Object.fromEntries([
              ...ctx.route.parameters.map((p) => [
                p.key,
                {
                  ...p.schema,
                  description: p.parameter().description,
                },
              ]),
              ...(ctx.route.query
                ? [
                    [
                      ctx.route.query.key,
                      {
                        ...ctx.route.query.schema,
                        title: ctx.route.query.title(),
                        description: ctx.route.query.description(),
                      },
                    ],
                  ]
                : []),
              ...(ctx.route.body
                ? [
                    [
                      ctx.route.body.key,
                      {
                        ...ctx.route.body.schema,
                        description: ctx.route.body.description(),
                      },
                    ],
                  ]
                : []),
            ]),
            required: [
              ...ctx.route.parameters.map((p) => p.key),
              ...(ctx.route.query ? [ctx.route.query.key] : []),
              ...(ctx.route.body ? [ctx.route.body.key] : []),
            ],
          },
        }),
      );
    if (ctx.route.headers)
      declare(
        "Headers",
        NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.headers.schema,
        }),
      );
    if (ctx.route.query)
      declare(
        "Query",
        NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.query.schema,
        }),
      );
    if (ctx.route.body)
      declare(
        "Body",
        NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.body.schema,
        }),
      );
    if (ctx.route.success)
      declare(
        "Response",
        NestiaMigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.success.schema,
        }),
      );
    return array;
  };

  const writeMetadata = (ctx: IContext): VariableStatement =>
    constant(
      "METADATA",
      factory.createAsExpression(
        factory.createObjectLiteralExpression(
          [
            factory.createPropertyAssignment(
              "method",
              factory.createStringLiteral(ctx.route.method.toUpperCase()),
            ),
            factory.createPropertyAssignment(
              "path",
              factory.createStringLiteral(getPath(ctx.route)),
            ),
            factory.createPropertyAssignment(
              "request",
              ctx.route.body
                ? LiteralFactory.write({
                    type: ctx.route.body.type,
                    encrypted: !!ctx.route.body["x-nestia-encrypted"],
                  })
                : factory.createNull(),
            ),
            factory.createPropertyAssignment(
              "response",
              ctx.route.method.toUpperCase() !== "HEAD"
                ? LiteralFactory.write({
                    type: ctx.route.success?.type ?? "application/json",
                    encrypted: !!ctx.route.success?.["x-nestia-encrypted"],
                  })
                : factory.createNull(),
            ),
            ...(ctx.route.success?.type === "application/x-www-form-urlencoded"
              ? [
                  factory.createPropertyAssignment(
                    "parseQuery",
                    factory.createCallExpression(
                      factory.createIdentifier(
                        `${ctx.importer.external({
                          type: "default",
                          library: "typia",
                          name: "typia",
                        })}.http.createAssertQuery`,
                      ),
                      [
                        NestiaMigrateSchemaProgrammer.write({
                          components: ctx.components,
                          importer: ctx.importer,
                          schema: ctx.route.success.schema,
                        }),
                      ],
                      undefined,
                    ),
                  ),
                ]
              : []),
          ],
          true,
        ),
        factory.createTypeReferenceNode(factory.createIdentifier("const")),
      ),
    );

  const writePathFunction = (ctx: IContext): VariableStatement => {
    const empty: boolean =
      ctx.route.parameters.length === 0 && ctx.route.query === null;
    const property = (key: string) =>
      ctx.config.keyword === true
        ? IdentifierFactory.access(factory.createIdentifier("props"), key)
        : factory.createIdentifier(key);
    const out = (body: Block | Expression) =>
      constant(
        "path",
        factory.createArrowFunction(
          [],
          [],
          empty
            ? []
            : ctx.config.keyword === true
              ? [
                  IdentifierFactory.parameter(
                    "props",
                    ctx.route.body
                      ? factory.createTypeReferenceNode("Omit", [
                          factory.createTypeReferenceNode("Props"),
                          factory.createLiteralTypeNode(
                            factory.createStringLiteral(ctx.route.body.key),
                          ),
                        ])
                      : factory.createTypeReferenceNode("Props"),
                  ),
                ]
              : [
                  ...ctx.route.parameters.map((p) =>
                    IdentifierFactory.parameter(
                      p.key,
                      NestiaMigrateSchemaProgrammer.write({
                        components: ctx.components,
                        importer: ctx.importer,
                        schema: p.schema,
                      }),
                    ),
                  ),
                  ...(ctx.route.query
                    ? [
                        IdentifierFactory.parameter(
                          ctx.route.query.key,
                          factory.createTypeReferenceNode(
                            `${ctx.route.accessor.at(-1)!}.Query`,
                          ),
                        ),
                      ]
                    : []),
                ],
          undefined,
          undefined,
          body,
        ),
      );
    const template = () => {
      const path: string = getPath(ctx.route);
      const split: string[] = path.split(":");
      if (split.length === 1) return factory.createStringLiteral(path);
      return factory.createTemplateExpression(
        factory.createTemplateHead(split[0]!),
        split.slice(1).map((s, i, arr) => {
          const name: string = s.split("/")[0]!;
          return factory.createTemplateSpan(
            factory.createCallExpression(
              factory.createIdentifier("encodeURIComponent"),
              undefined,
              [
                factory.createBinaryExpression(
                  property(
                    ctx.route.parameters.find((p) => p.name === name)!.key,
                  ),
                  factory.createToken(SyntaxKind.QuestionQuestionToken),
                  factory.createStringLiteral("null"),
                ),
              ],
            ),
            (i !== arr.length - 1
              ? factory.createTemplateMiddle
              : factory.createTemplateTail)(s.substring(name.length)),
          );
        }),
      );
    };
    if (!ctx.route.query) return out(template());

    const computeName = (str: string): string =>
      ctx.route.parameters.find((p) => p.key === str) !== undefined
        ? computeName("_" + str)
        : str;
    const variables: string = computeName("variables");
    return out(
      factory.createBlock(
        [
          local({
            name: variables,
            type: "URLSearchParams",
            expression: factory.createNewExpression(
              factory.createIdentifier("URLSearchParams"),
              [],
              [],
            ),
          }),
          factory.createForOfStatement(
            undefined,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  factory.createArrayBindingPattern([
                    factory.createBindingElement(
                      undefined,
                      undefined,
                      factory.createIdentifier("key"),
                      undefined,
                    ),
                    factory.createBindingElement(
                      undefined,
                      undefined,
                      factory.createIdentifier("value"),
                      undefined,
                    ),
                  ]),
                  undefined,
                  undefined,
                  undefined,
                ),
              ],
              NodeFlags.Const,
            ),
            factory.createCallExpression(
              factory.createIdentifier("Object.entries"),
              undefined,
              [
                factory.createAsExpression(
                  property(ctx.route.query.key),
                  TypeFactory.keyword("any"),
                ),
              ],
            ),
            factory.createIfStatement(
              factory.createStrictEquality(
                factory.createIdentifier("undefined"),
                factory.createIdentifier("value"),
              ),
              factory.createContinueStatement(),
              factory.createIfStatement(
                factory.createCallExpression(
                  factory.createIdentifier("Array.isArray"),
                  undefined,
                  [factory.createIdentifier("value")],
                ),
                factory.createExpressionStatement(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("value"),
                      factory.createIdentifier("forEach"),
                    ),
                    undefined,
                    [
                      factory.createArrowFunction(
                        undefined,
                        undefined,
                        [IdentifierFactory.parameter("elem")],
                        undefined,
                        undefined,
                        factory.createCallExpression(
                          IdentifierFactory.access(
                            factory.createIdentifier(variables),
                            "append",
                          ),
                          undefined,
                          [
                            factory.createIdentifier("key"),
                            factory.createCallExpression(
                              factory.createIdentifier("String"),
                              undefined,
                              [factory.createIdentifier("elem")],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                factory.createExpressionStatement(
                  factory.createCallExpression(
                    IdentifierFactory.access(
                      factory.createIdentifier(variables),
                      "set",
                    ),
                    undefined,
                    [
                      factory.createIdentifier("key"),
                      factory.createCallExpression(
                        factory.createIdentifier("String"),
                        undefined,
                        [factory.createIdentifier("value")],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          local({
            name: "location",
            type: "string",
            expression: template(),
          }),
          factory.createReturnStatement(
            factory.createConditionalExpression(
              factory.createStrictEquality(
                ExpressionFactory.number(0),
                IdentifierFactory.access(
                  factory.createIdentifier(variables),
                  "size",
                ),
              ),
              undefined,
              factory.createIdentifier("location"),
              undefined,
              factory.createTemplateExpression(factory.createTemplateHead(""), [
                factory.createTemplateSpan(
                  factory.createIdentifier("location"),
                  factory.createTemplateMiddle("?"),
                ),
                factory.createTemplateSpan(
                  factory.createCallExpression(
                    IdentifierFactory.access(
                      factory.createIdentifier(variables),
                      "toString",
                    ),
                    undefined,
                    undefined,
                  ),
                  factory.createTemplateTail(""),
                ),
              ]),
            ),
          ),
        ],
        true,
      ),
    );
  };
}

const constant = (name: string, expression: Expression) =>
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          name,
          undefined,
          undefined,
          expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );

const getPath = (route: IHttpMigrateRoute) =>
  (route.emendedPath.startsWith("/") ? "" : "/") + route.emendedPath;

const local = (props: { name: string; type: string; expression: Expression }) =>
  factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          props.name,
          undefined,
          factory.createTypeReferenceNode(props.type),
          props.expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );
