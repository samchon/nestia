import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateApiSimulatationProgrammer } from "./MigrateApiSimulatationProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateApiNamespaceProgrammer {
  export interface IProps {
    controller: IMigrateController;
    route: IMigrateRoute;
    alias: string;
  }

  export const write =
    (config: IMigrateProgram.IConfig) =>
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.ModuleDeclaration => {
      const types = writeTypes(components)(importer)(props.route);
      return ts.factory.createModuleDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(props.alias),
        ts.factory.createModuleBlock([
          ...types,
          ...(types.length ? [FilePrinter.newLine()] : []),
          writeMetadata(components)(importer)(props),
          FilePrinter.newLine(),
          writePath(components)(importer)(props),
          ...(config.simulate
            ? [
                MigrateApiSimulatationProgrammer.random(components)(importer)(
                  props,
                ),
                MigrateApiSimulatationProgrammer.simulate(components)(importer)(
                  props,
                ),
              ]
            : []),
        ]),
        ts.NodeFlags.Namespace,
      );
    };

  export const writePathCallExpression = (props: IProps) =>
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(`${props.alias}.path`),
      undefined,
      [
        ...props.route.parameters.map((p) =>
          ts.factory.createIdentifier(p.key),
        ),
        ...(props.route.query
          ? [ts.factory.createIdentifier(props.route.query.key)]
          : []),
      ],
    );

  const writeTypes =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (route: IMigrateRoute): ts.TypeAliasDeclaration[] => {
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
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.VariableStatement =>
      constant("METADATA")(
        ts.factory.createAsExpression(
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                "method",
                ts.factory.createStringLiteral(
                  props.route.method.toUpperCase(),
                ),
              ),
              ts.factory.createPropertyAssignment(
                "path",
                ts.factory.createStringLiteral(getPath(props)),
              ),
              ts.factory.createPropertyAssignment(
                "request",
                props.route.body
                  ? LiteralFactory.generate({
                      type: props.route.body.type,
                      encrypted: !!props.route.body["x-nestia-encrypted"],
                    })
                  : ts.factory.createNull(),
              ),
              ts.factory.createPropertyAssignment(
                "response",
                props.route.method.toUpperCase() !== "HEAD"
                  ? LiteralFactory.generate({
                      type: props.route.success?.type ?? "application/json",
                      encrypted: !!props.route.success?.["x-nestia-encrypted"],
                    })
                  : ts.factory.createNull(),
              ),
              ...(props.route.success?.type ===
              "application/x-www-form-urlencoded"
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
                            props.route.success.schema,
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
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.VariableStatement => {
      const out = (body: ts.ConciseBody) =>
        constant("path")(
          ts.factory.createArrowFunction(
            [],
            [],
            [
              ...props.route.parameters.map((p) =>
                IdentifierFactory.parameter(
                  p.key,
                  MigrateSchemaProgrammer.write(components)(importer)(p.schema),
                ),
              ),
              ...(props.route.query
                ? [
                    IdentifierFactory.parameter(
                      props.route.query.key,
                      ts.factory.createTypeReferenceNode(
                        `${props.alias}.Query`,
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
        const path: string = getPath(props);
        const splitted: string[] = path.split(":");
        if (splitted.length === 1) return ts.factory.createStringLiteral(path);
        return ts.factory.createTemplateExpression(
          ts.factory.createTemplateHead(splitted[0]),
          splitted.slice(1).map((s, i, arr) => {
            const name: string = s.split("/")[0];
            return ts.factory.createTemplateSpan(
              ts.factory.createCallExpression(
                ts.factory.createIdentifier("encodeURIComponent"),
                undefined,
                [
                  ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier(
                      props.route.parameters.find((p) => p.name === name)!.key,
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
      if (!props.route.query) return out(template());

      const computeName = (str: string): string =>
        props.route.parameters.find((p) => p.key === str) !== undefined
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
                    ts.factory.createIdentifier(props.route.query.key),
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
                            )("append"),
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
                      )("set"),
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
                  )("size"),
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
                        )("toString"),
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
const getPath = (props: MigrateApiNamespaceProgrammer.IProps) =>
  "/" +
  [...props.controller.path.split("/"), ...props.route.path.split("/")]
    .filter((str) => !!str.length)
    .join("/");
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
