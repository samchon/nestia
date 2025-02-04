import { OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { IHttpMigrateProgram } from "../structures/IHttpMigrateProgram";
import { IHttpMigrateRoute } from "../structures/IHttpMigrateRoute";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateApiSimulationProgrammer } from "./MigrateApiSimulationProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateApiNamespaceProgrammer {
  export const write =
    (config: IHttpMigrateProgram.IConfig) =>
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.ModuleDeclaration => {
      const types = writeTypes(components)(importer)(route);
      return ts.factory.createModuleDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(route.accessor.at(-1)!),
        ts.factory.createModuleBlock([
          ...types,
          ...(types.length ? [FilePrinter.newLine()] : []),
          writeMetadata(components)(importer)(route),
          FilePrinter.newLine(),
          writePath(components)(importer)(route),
          ...(config.simulate
            ? [
                MigrateApiSimulationProgrammer.random(components)(importer)(
                  route,
                ),
                MigrateApiSimulationProgrammer.simulate(components)(importer)(
                  route,
                ),
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

  const writeTypes =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.TypeAliasDeclaration[] => {
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
      if (route.headers)
        declare(
          "Headers",
          MigrateSchemaProgrammer.write(components)(importer)(
            route.headers.schema,
          ),
        );
      if (route.query)
        declare(
          "Query",
          MigrateSchemaProgrammer.write(components)(importer)(
            route.query.schema,
          ),
        );
      if (route.body)
        declare(
          "Input",
          MigrateSchemaProgrammer.write(components)(importer)(
            route.body.schema,
          ),
        );
      if (route.success)
        declare(
          "Output",
          MigrateSchemaProgrammer.write(components)(importer)(
            route.success.schema,
          ),
        );
      return array;
    };

  const writeMetadata =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.VariableStatement =>
      constant("METADATA")(
        ts.factory.createAsExpression(
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                "method",
                ts.factory.createStringLiteral(route.method.toUpperCase()),
              ),
              ts.factory.createPropertyAssignment(
                "path",
                ts.factory.createStringLiteral(getPath(route)),
              ),
              ts.factory.createPropertyAssignment(
                "request",
                route.body
                  ? LiteralFactory.write({
                      type: route.body.type,
                      encrypted: !!route.body["x-nestia-encrypted"],
                    })
                  : ts.factory.createNull(),
              ),
              ts.factory.createPropertyAssignment(
                "response",
                route.method.toUpperCase() !== "HEAD"
                  ? LiteralFactory.write({
                      type: route.success?.type ?? "application/json",
                      encrypted: !!route.success?.["x-nestia-encrypted"],
                    })
                  : ts.factory.createNull(),
              ),
              ...(route.success?.type === "application/x-www-form-urlencoded"
                ? [
                    ts.factory.createPropertyAssignment(
                      "parseQuery",
                      ts.factory.createCallExpression(
                        ts.factory.createIdentifier(
                          `${importer.external({
                            type: "default",
                            library: "typia",
                            name: "typia",
                          })}.http.createAssertQuery`,
                        ),
                        [
                          MigrateSchemaProgrammer.write(components)(importer)(
                            route.success.schema,
                          ),
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

  const writePath =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IHttpMigrateRoute): ts.VariableStatement => {
      const out = (body: ts.ConciseBody) =>
        constant("path")(
          ts.factory.createArrowFunction(
            [],
            [],
            [
              ...route.parameters.map((p) =>
                IdentifierFactory.parameter(
                  p.key,
                  MigrateSchemaProgrammer.write(components)(importer)(p.schema),
                ),
              ),
              ...(route.query
                ? [
                    IdentifierFactory.parameter(
                      route.query.key,
                      ts.factory.createTypeReferenceNode(
                        `${route.accessor.at(-1)!}.Query`,
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
        const path: string = getPath(route);
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
                      route.parameters.find((p) => p.name === name)!.key,
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
      if (!route.query) return out(template());

      const computeName = (str: string): string =>
        route.parameters.find((p) => p.key === str) !== undefined
          ? computeName("_" + str)
          : str;
      const variables: string = computeName("variables");
      return out(
        ts.factory.createBlock(
          [
            local(variables)("URLSearchParams")(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("URLSearchParams"),
                [],
                [],
              ),
            ),
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
                    ts.factory.createIdentifier(route.query.key),
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
            local("location")("string")(template()),
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

const constant = (name: string) => (expression: ts.Expression) =>
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
const getPath = (route: IHttpMigrateRoute) => "/" + route.emendedPath;
const local = (name: string) => (type: string) => (expression: ts.Expression) =>
  ts.factory.createVariableStatement(
    [],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          name,
          undefined,
          ts.factory.createTypeReferenceNode(type),
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
