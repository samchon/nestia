import { TypeScriptFactory } from "@nestia/factory";
import {
  ExpressionFactory,
  IdentifierFactory,
  LiteralFactory,
  TypeFactory,
} from "@typia/core";
import { IHttpMigrateRoute } from "@typia/interface";
import ts from "typescript";
import { OpenApi } from "typia";

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

  export const write = (ctx: IContext): ts.ModuleDeclaration => {
    const types: ts.TypeAliasDeclaration[] = writeTypes(ctx);
    return TypeScriptFactory.createModuleDeclaration(
      [TypeScriptFactory.createToken(ts.SyntaxKind.ExportKeyword)],
      TypeScriptFactory.createIdentifier(ctx.route.accessor.at(-1)!),
      TypeScriptFactory.createModuleBlock([
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
      ts.NodeFlags.Namespace,
    );
  };

  export const writePathCallExpression = (
    config: INestiaMigrateConfig,
    route: IHttpMigrateRoute,
  ) =>
    TypeScriptFactory.createCallExpression(
      TypeScriptFactory.createIdentifier(`${route.accessor.at(-1)!}.path`),
      undefined,
      route.parameters.length === 0 && route.query === null
        ? []
        : config.keyword === true
          ? [TypeScriptFactory.createIdentifier("props")]
          : [...route.parameters, ...(route.query ? [route.query] : [])].map(
              (p) => TypeScriptFactory.createIdentifier(p.key),
            ),
    );

  const writeTypes = (ctx: IContext): ts.TypeAliasDeclaration[] => {
    const array: ts.TypeAliasDeclaration[] = [];
    const declare = (name: string, type: ts.TypeNode) =>
      array.push(
        TypeScriptFactory.createTypeAliasDeclaration(
          [TypeScriptFactory.createModifier(ts.SyntaxKind.ExportKeyword)],
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

  const writeMetadata = (ctx: IContext): ts.VariableStatement =>
    constant(
      "METADATA",
      TypeScriptFactory.createAsExpression(
        TypeScriptFactory.createObjectLiteralExpression(
          [
            TypeScriptFactory.createPropertyAssignment(
              "method",
              TypeScriptFactory.createStringLiteral(
                ctx.route.method.toUpperCase(),
              ),
            ),
            TypeScriptFactory.createPropertyAssignment(
              "path",
              TypeScriptFactory.createStringLiteral(getPath(ctx.route)),
            ),
            TypeScriptFactory.createPropertyAssignment(
              "request",
              ctx.route.body
                ? LiteralFactory.write({
                    type: ctx.route.body.type,
                    encrypted: !!ctx.route.body["x-nestia-encrypted"],
                  })
                : TypeScriptFactory.createNull(),
            ),
            TypeScriptFactory.createPropertyAssignment(
              "response",
              ctx.route.method.toUpperCase() !== "HEAD"
                ? LiteralFactory.write({
                    type: ctx.route.success?.type ?? "application/json",
                    encrypted: !!ctx.route.success?.["x-nestia-encrypted"],
                  })
                : TypeScriptFactory.createNull(),
            ),
            ...(ctx.route.success?.type === "application/x-www-form-urlencoded"
              ? [
                  TypeScriptFactory.createPropertyAssignment(
                    "parseQuery",
                    TypeScriptFactory.createCallExpression(
                      TypeScriptFactory.createIdentifier(
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
        TypeScriptFactory.createTypeReferenceNode(
          TypeScriptFactory.createIdentifier("const"),
        ),
      ),
    );

  const writePathFunction = (ctx: IContext): ts.VariableStatement => {
    const empty: boolean =
      ctx.route.parameters.length === 0 && ctx.route.query === null;
    const property = (key: string) =>
      ctx.config.keyword === true
        ? IdentifierFactory.access(
            TypeScriptFactory.createIdentifier("props"),
            key,
          )
        : TypeScriptFactory.createIdentifier(key);
    const out = (body: ts.ConciseBody) =>
      constant(
        "path",
        TypeScriptFactory.createArrowFunction(
          [],
          [],
          empty
            ? []
            : ctx.config.keyword === true
              ? [
                  IdentifierFactory.parameter(
                    "props",
                    ctx.route.body
                      ? TypeScriptFactory.createTypeReferenceNode("Omit", [
                          TypeScriptFactory.createTypeReferenceNode("Props"),
                          TypeScriptFactory.createLiteralTypeNode(
                            TypeScriptFactory.createStringLiteral(
                              ctx.route.body.key,
                            ),
                          ),
                        ])
                      : TypeScriptFactory.createTypeReferenceNode("Props"),
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
                          TypeScriptFactory.createTypeReferenceNode(
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
      if (split.length === 1)
        return TypeScriptFactory.createStringLiteral(path);
      return TypeScriptFactory.createTemplateExpression(
        TypeScriptFactory.createTemplateHead(split[0]!),
        split.slice(1).map((s, i, arr) => {
          const name: string = s.split("/")[0]!;
          return TypeScriptFactory.createTemplateSpan(
            TypeScriptFactory.createCallExpression(
              TypeScriptFactory.createIdentifier("encodeURIComponent"),
              undefined,
              [
                TypeScriptFactory.createBinaryExpression(
                  property(
                    ctx.route.parameters.find((p) => p.name === name)!.key,
                  ),
                  TypeScriptFactory.createToken(
                    ts.SyntaxKind.QuestionQuestionToken,
                  ),
                  TypeScriptFactory.createStringLiteral("null"),
                ),
              ],
            ),
            (i !== arr.length - 1
              ? TypeScriptFactory.createTemplateMiddle
              : TypeScriptFactory.createTemplateTail)(s.substring(name.length)),
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
      TypeScriptFactory.createBlock(
        [
          local({
            name: variables,
            type: "URLSearchParams",
            expression: TypeScriptFactory.createNewExpression(
              TypeScriptFactory.createIdentifier("URLSearchParams"),
              [],
              [],
            ),
          }),
          TypeScriptFactory.createForOfStatement(
            undefined,
            TypeScriptFactory.createVariableDeclarationList(
              [
                TypeScriptFactory.createVariableDeclaration(
                  TypeScriptFactory.createArrayBindingPattern([
                    TypeScriptFactory.createBindingElement(
                      undefined,
                      undefined,
                      TypeScriptFactory.createIdentifier("key"),
                      undefined,
                    ),
                    TypeScriptFactory.createBindingElement(
                      undefined,
                      undefined,
                      TypeScriptFactory.createIdentifier("value"),
                      undefined,
                    ),
                  ]),
                  undefined,
                  undefined,
                  undefined,
                ),
              ],
              ts.NodeFlags.Const,
            ),
            TypeScriptFactory.createCallExpression(
              TypeScriptFactory.createIdentifier("Object.entries"),
              undefined,
              [
                TypeScriptFactory.createAsExpression(
                  property(ctx.route.query.key),
                  TypeFactory.keyword("any"),
                ),
              ],
            ),
            TypeScriptFactory.createIfStatement(
              TypeScriptFactory.createStrictEquality(
                TypeScriptFactory.createIdentifier("undefined"),
                TypeScriptFactory.createIdentifier("value"),
              ),
              TypeScriptFactory.createContinueStatement(),
              TypeScriptFactory.createIfStatement(
                TypeScriptFactory.createCallExpression(
                  TypeScriptFactory.createIdentifier("Array.isArray"),
                  undefined,
                  [TypeScriptFactory.createIdentifier("value")],
                ),
                TypeScriptFactory.createExpressionStatement(
                  TypeScriptFactory.createCallExpression(
                    TypeScriptFactory.createPropertyAccessExpression(
                      TypeScriptFactory.createIdentifier("value"),
                      TypeScriptFactory.createIdentifier("forEach"),
                    ),
                    undefined,
                    [
                      TypeScriptFactory.createArrowFunction(
                        undefined,
                        undefined,
                        [IdentifierFactory.parameter("elem")],
                        undefined,
                        undefined,
                        TypeScriptFactory.createCallExpression(
                          IdentifierFactory.access(
                            TypeScriptFactory.createIdentifier(variables),
                            "append",
                          ),
                          undefined,
                          [
                            TypeScriptFactory.createIdentifier("key"),
                            TypeScriptFactory.createCallExpression(
                              TypeScriptFactory.createIdentifier("String"),
                              undefined,
                              [TypeScriptFactory.createIdentifier("elem")],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                TypeScriptFactory.createExpressionStatement(
                  TypeScriptFactory.createCallExpression(
                    IdentifierFactory.access(
                      TypeScriptFactory.createIdentifier(variables),
                      "set",
                    ),
                    undefined,
                    [
                      TypeScriptFactory.createIdentifier("key"),
                      TypeScriptFactory.createCallExpression(
                        TypeScriptFactory.createIdentifier("String"),
                        undefined,
                        [TypeScriptFactory.createIdentifier("value")],
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
          TypeScriptFactory.createReturnStatement(
            TypeScriptFactory.createConditionalExpression(
              TypeScriptFactory.createStrictEquality(
                ExpressionFactory.number(0),
                IdentifierFactory.access(
                  TypeScriptFactory.createIdentifier(variables),
                  "size",
                ),
              ),
              undefined,
              TypeScriptFactory.createIdentifier("location"),
              undefined,
              TypeScriptFactory.createTemplateExpression(
                TypeScriptFactory.createTemplateHead(""),
                [
                  TypeScriptFactory.createTemplateSpan(
                    TypeScriptFactory.createIdentifier("location"),
                    TypeScriptFactory.createTemplateMiddle("?"),
                  ),
                  TypeScriptFactory.createTemplateSpan(
                    TypeScriptFactory.createCallExpression(
                      IdentifierFactory.access(
                        TypeScriptFactory.createIdentifier(variables),
                        "toString",
                      ),
                      undefined,
                      undefined,
                    ),
                    TypeScriptFactory.createTemplateTail(""),
                  ),
                ],
              ),
            ),
          ),
        ],
        true,
      ),
    );
  };
}

const constant = (name: string, expression: ts.Expression) =>
  TypeScriptFactory.createVariableStatement(
    [TypeScriptFactory.createModifier(ts.SyntaxKind.ExportKeyword)],
    TypeScriptFactory.createVariableDeclarationList(
      [
        TypeScriptFactory.createVariableDeclaration(
          name,
          undefined,
          undefined,
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );

const getPath = (route: IHttpMigrateRoute) =>
  (route.emendedPath.startsWith("/") ? "" : "/") + route.emendedPath;

const local = (props: {
  name: string;
  type: string;
  expression: ts.Expression;
}) =>
  TypeScriptFactory.createVariableStatement(
    [],
    TypeScriptFactory.createVariableDeclarationList(
      [
        TypeScriptFactory.createVariableDeclaration(
          props.name,
          undefined,
          TypeScriptFactory.createTypeReferenceNode(props.type),
          props.expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
