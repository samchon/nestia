import { IHttpMigrateRoute, OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaMigrateConfig } from "../structures/INestiaMigrateConfig";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateApiSimulationProgrammer } from "./MigrateApiSimulationProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateApiNamespaceProgrammer {
  export interface IContext {
    config: INestiaMigrateConfig;
    components: OpenApi.IComponents;
    importer: MigrateImportProgrammer;
    route: IHttpMigrateRoute;
  }

  export const write = (ctx: IContext): ts.ModuleDeclaration => {
    const types = writeTypes(ctx);
    return ts.factory.createModuleDeclaration(
      [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
      ts.factory.createIdentifier(ctx.route.accessor.at(-1)!),
      ts.factory.createModuleBlock([
        ...types,
        ...(types.length ? [FilePrinter.newLine()] : []),
        writeMetadata(ctx),
        FilePrinter.newLine(),
        writePath(ctx),
        ...(ctx.config.simulate
          ? [
              MigrateApiSimulationProgrammer.random(ctx),
              MigrateApiSimulationProgrammer.simulate(ctx),
            ]
          : []),
      ]),
      ts.NodeFlags.Namespace,
    );
  };

  export const writePathCallExpression = (route: IHttpMigrateRoute) =>
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(`${route.accessor.at(-1)!}.path`),
      undefined,
      [
        ...route.parameters.map((p) => ts.factory.createIdentifier(p.key)),
        ...(route.query ? [ts.factory.createIdentifier(route.query.key)] : []),
      ],
    );

  const writeTypes = (ctx: IContext): ts.TypeAliasDeclaration[] => {
    const array: ts.TypeAliasDeclaration[] = [];
    const declare = (name: string, type: ts.TypeNode) =>
      array.push(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          name,
          undefined,
          type,
        ),
      );
    if (ctx.route.headers)
      declare(
        "Headers",
        MigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.headers.schema,
        }),
      );
    if (ctx.route.query)
      declare(
        "Query",
        MigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.query.schema,
        }),
      );
    if (ctx.route.body)
      declare(
        "Input",
        MigrateSchemaProgrammer.write({
          components: ctx.components,
          importer: ctx.importer,
          schema: ctx.route.body.schema,
        }),
      );
    if (ctx.route.success)
      declare(
        "Output",
        MigrateSchemaProgrammer.write({
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
      ts.factory.createAsExpression(
        ts.factory.createObjectLiteralExpression(
          [
            ts.factory.createPropertyAssignment(
              "method",
              ts.factory.createStringLiteral(ctx.route.method.toUpperCase()),
            ),
            ts.factory.createPropertyAssignment(
              "path",
              ts.factory.createStringLiteral(getPath(ctx.route)),
            ),
            ts.factory.createPropertyAssignment(
              "request",
              ctx.route.body
                ? LiteralFactory.write({
                    type: ctx.route.body.type,
                    encrypted: !!ctx.route.body["x-nestia-encrypted"],
                  })
                : ts.factory.createNull(),
            ),
            ts.factory.createPropertyAssignment(
              "response",
              ctx.route.method.toUpperCase() !== "HEAD"
                ? LiteralFactory.write({
                    type: ctx.route.success?.type ?? "application/json",
                    encrypted: !!ctx.route.success?.["x-nestia-encrypted"],
                  })
                : ts.factory.createNull(),
            ),
            ...(ctx.route.success?.type === "application/x-www-form-urlencoded"
              ? [
                  ts.factory.createPropertyAssignment(
                    "parseQuery",
                    ts.factory.createCallExpression(
                      ts.factory.createIdentifier(
                        `${ctx.importer.external({
                          type: "default",
                          library: "typia",
                          name: "typia",
                        })}.http.createAssertQuery`,
                      ),
                      [
                        MigrateSchemaProgrammer.write({
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
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier("const"),
        ),
      ),
    );

  const writePath = (ctx: IContext): ts.VariableStatement => {
    const out = (body: ts.ConciseBody) =>
      constant(
        "path",
        ts.factory.createArrowFunction(
          [],
          [],
          [
            ...ctx.route.parameters.map((p) =>
              IdentifierFactory.parameter(
                p.key,
                MigrateSchemaProgrammer.write({
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
                    ts.factory.createTypeReferenceNode(
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
      if (split.length === 1) return ts.factory.createStringLiteral(path);
      return ts.factory.createTemplateExpression(
        ts.factory.createTemplateHead(split[0]),
        split.slice(1).map((s, i, arr) => {
          const name: string = s.split("/")[0];
          return ts.factory.createTemplateSpan(
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("encodeURIComponent"),
              undefined,
              [
                ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier(
                    ctx.route.parameters.find((p) => p.name === name)!.key,
                  ),
                  ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                  ts.factory.createStringLiteral("null"),
                ),
              ],
            ),
            (i !== arr.length - 1
              ? ts.factory.createTemplateMiddle
              : ts.factory.createTemplateTail)(s.substring(name.length)),
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
      ts.factory.createBlock(
        [
          local({
            name: variables,
            type: "URLSearchParams",
            expression: ts.factory.createNewExpression(
              ts.factory.createIdentifier("URLSearchParams"),
              [],
              [],
            ),
          }),
          ts.factory.createForOfStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  ts.factory.createArrayBindingPattern([
                    ts.factory.createBindingElement(
                      undefined,
                      undefined,
                      ts.factory.createIdentifier("key"),
                      undefined,
                    ),
                    ts.factory.createBindingElement(
                      undefined,
                      undefined,
                      ts.factory.createIdentifier("value"),
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
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("Object.entries"),
              undefined,
              [
                ts.factory.createAsExpression(
                  ts.factory.createIdentifier(ctx.route.query.key),
                  TypeFactory.keyword("any"),
                ),
              ],
            ),
            ts.factory.createIfStatement(
              ts.factory.createStrictEquality(
                ts.factory.createIdentifier("undefined"),
                ts.factory.createIdentifier("value"),
              ),
              ts.factory.createContinueStatement(),
              ts.factory.createIfStatement(
                ts.factory.createCallExpression(
                  ts.factory.createIdentifier("Array.isArray"),
                  undefined,
                  [ts.factory.createIdentifier("value")],
                ),
                ts.factory.createExpressionStatement(
                  ts.factory.createCallExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("value"),
                      ts.factory.createIdentifier("forEach"),
                    ),
                    undefined,
                    [
                      ts.factory.createArrowFunction(
                        undefined,
                        undefined,
                        [IdentifierFactory.parameter("elem")],
                        undefined,
                        undefined,
                        ts.factory.createCallExpression(
                          IdentifierFactory.access(
                            ts.factory.createIdentifier(variables),
                            "append",
                          ),
                          undefined,
                          [
                            ts.factory.createIdentifier("key"),
                            ts.factory.createCallExpression(
                              ts.factory.createIdentifier("String"),
                              undefined,
                              [ts.factory.createIdentifier("elem")],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                ts.factory.createExpressionStatement(
                  ts.factory.createCallExpression(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(variables),
                      "set",
                    ),
                    undefined,
                    [
                      ts.factory.createIdentifier("key"),
                      ts.factory.createCallExpression(
                        ts.factory.createIdentifier("String"),
                        undefined,
                        [ts.factory.createIdentifier("value")],
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
          ts.factory.createReturnStatement(
            ts.factory.createConditionalExpression(
              ts.factory.createStrictEquality(
                ExpressionFactory.number(0),
                IdentifierFactory.access(
                  ts.factory.createIdentifier(variables),
                  "size",
                ),
              ),
              undefined,
              ts.factory.createIdentifier("location"),
              undefined,
              ts.factory.createTemplateExpression(
                ts.factory.createTemplateHead(""),
                [
                  ts.factory.createTemplateSpan(
                    ts.factory.createIdentifier("location"),
                    ts.factory.createTemplateMiddle("?"),
                  ),
                  ts.factory.createTemplateSpan(
                    ts.factory.createCallExpression(
                      IdentifierFactory.access(
                        ts.factory.createIdentifier(variables),
                        "toString",
                      ),
                      undefined,
                      undefined,
                    ),
                    ts.factory.createTemplateTail(""),
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
  ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
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
  ts.factory.createVariableStatement(
    [],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          props.name,
          undefined,
          ts.factory.createTypeReferenceNode(props.type),
          props.expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
