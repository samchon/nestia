import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { Escaper } from "typia/lib/utils/Escaper";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpSimulationProgrammer } from "./SdkHttpSimulationProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkHttpNamespaceProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRouteParameter.IHeaders | undefined;
        query: ITypedHttpRouteParameter.IQuery | undefined;
        body: ITypedHttpRouteParameter.IBody | undefined;
      },
    ): ts.ModuleDeclaration => {
      const types = writeTypes(project)(importer)(route, props);
      return ts.factory.createModuleDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(route.name),
        ts.factory.createModuleBlock([
          ...types,
          ...(types.length ? [FilePrinter.enter()] : []),
          writeMetadata(project)(importer)(route, props),
          FilePrinter.enter(),
          writePath(project)(importer)(route, props.query),
          ...(project.config.simulate
            ? [
                SdkHttpSimulationProgrammer.random(project)(importer)(route),
                SdkHttpSimulationProgrammer.simulate(project)(importer)(
                  route,
                  props,
                ),
              ]
            : []),
          ...(project.config.json &&
          props.body !== undefined &&
          (props.body.contentType === "application/json" ||
            props.body.encrypted === true)
            ? [writeStringify(project)(importer)]
            : []),
        ]),
        ts.NodeFlags.Namespace,
      );
    };

  const writeTypes =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRouteParameter.IHeaders | undefined;
        query: ITypedHttpRouteParameter.IQuery | undefined;
        body: ITypedHttpRouteParameter.IBody | undefined;
      },
    ): ts.TypeAliasDeclaration[] => {
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
      if (
        project.config.keyword === true &&
        route.parameters.filter((p) => p.category !== "headers").length !== 0
      )
        declare("IProps", SdkAliasCollection.props(project)(importer)(route));
      if (props.headers !== undefined)
        declare(
          "Headers",
          SdkAliasCollection.headers(project)(importer)(props.headers),
        );
      if (props.query !== undefined)
        declare(
          "Query",
          SdkAliasCollection.query(project)(importer)(props.query),
        );
      if (props.body !== undefined)
        declare(
          "RequestBody",
          SdkAliasCollection.body(project)(importer)(props.body),
        );
      if (
        project.config.propagate === true ||
        route.success.metadata.size() !== 0
      )
        declare(
          "Response",
          SdkAliasCollection.response(project)(importer)(route),
        );
      return array;
    };

  const writeMetadata =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRouteParameter.IHeaders | undefined;
        query: ITypedHttpRouteParameter.IQuery | undefined;
        body: ITypedHttpRouteParameter.IBody | undefined;
      },
    ): ts.VariableStatement =>
      constant("METADATA")(
        ts.factory.createAsExpression(
          ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createPropertyAssignment(
                "method",
                ts.factory.createStringLiteral(route.method),
              ),
              ts.factory.createPropertyAssignment(
                "path",
                ts.factory.createStringLiteral(route.path),
              ),
              ts.factory.createPropertyAssignment(
                "request",
                props.body
                  ? LiteralFactory.write(
                      props.body !== undefined
                        ? {
                            type: props.body.contentType,
                            encrypted: !!props.body.encrypted,
                          }
                        : {
                            type: "application/json",
                            encrypted: false,
                          },
                    )
                  : ts.factory.createNull(),
              ),
              ts.factory.createPropertyAssignment(
                "response",
                route.method !== "HEAD"
                  ? LiteralFactory.write({
                      type: route.success.contentType,
                      encrypted: !!route.success.encrypted,
                    })
                  : ts.factory.createNull(),
              ),
              ts.factory.createPropertyAssignment(
                "status",
                route.success.status !== null
                  ? ExpressionFactory.number(route.success.status)
                  : ts.factory.createNull(),
              ),
              ...(route.success.contentType ===
              "application/x-www-form-urlencoded"
                ? [
                    ts.factory.createPropertyAssignment(
                      "parseQuery",
                      ts.factory.createCallExpression(
                        ts.factory.createIdentifier(
                          `${SdkImportWizard.typia(importer)}.http.createAssertQuery`,
                        ),
                        [
                          project.config.clone === true
                            ? SdkAliasCollection.from(project)(importer)(
                                route.success.metadata,
                              )
                            : SdkAliasCollection.name(route.success),
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
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      query: ITypedHttpRouteParameter.IQuery | undefined,
    ): ts.VariableStatement => {
      interface IProperty {
        key: string;
        value: ts.TypeNode;
        required: boolean;
      }
      const g = {
        total: [
          ...route.parameters.filter(
            (param) => param.category === "param" || param.category === "query",
          ),
        ],
        query: route.parameters
          .filter((param) => param.category === "query")
          .filter((param) => param.field !== null),
        path: route.parameters.filter((param) => param.category === "param"),
      };
      const properties: IProperty[] = g.total.map((p) => ({
        key: p.name,
        value:
          p === query
            ? p.metadata.isRequired() === false
              ? ts.factory.createUnionTypeNode([
                  ts.factory.createTypeReferenceNode(`${route.name}.Query`),
                  ts.factory.createTypeReferenceNode("undefined"),
                ])
              : ts.factory.createTypeReferenceNode(`${route.name}.Query`)
            : project.config.clone === true
              ? SdkAliasCollection.from(project)(importer)(p.metadata)
              : SdkAliasCollection.name(p),
        required: p.metadata.isRequired(),
      }));
      const out = (body: ts.ConciseBody) =>
        constant("path")(
          ts.factory.createArrowFunction(
            [],
            [],
            project.config.keyword === true && properties.length !== 0
              ? [
                  IdentifierFactory.parameter(
                    "p",
                    ts.factory.createTypeLiteralNode(
                      properties.map((p) =>
                        ts.factory.createPropertySignature(
                          undefined,
                          p.key,
                          p.required
                            ? undefined
                            : ts.factory.createToken(
                                ts.SyntaxKind.QuestionToken,
                              ),
                          p.value,
                        ),
                      ),
                    ),
                  ),
                ]
              : properties.map((p) =>
                  IdentifierFactory.parameter(p.key, p.value),
                ),
            undefined,
            undefined,
            body,
          ),
        );
      if (g.total.length === 0)
        return out(ts.factory.createStringLiteral(route.path));

      const access = (name: string) =>
        project.config.keyword === true ? `p.${name}` : name;
      const template = () => {
        const split: string[] = route.path.split(":");
        if (split.length === 1)
          return ts.factory.createStringLiteral(route.path);
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
                    ts.factory.createCallChain(
                      ts.factory.createPropertyAccessChain(
                        ts.factory.createIdentifier(
                          access(g.path.find((p) => p.field === name)!.name),
                        ),
                        ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                        "toString",
                      ),
                      undefined,
                      undefined,
                      [],
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
      if (query === undefined && g.query.length === 0) return out(template());

      const block = (expr: ts.Expression) => {
        const computeName = (str: string): string =>
          g.total.find((p) => p.name === str) !== undefined
            ? computeName("_" + str)
            : str;
        const variables: string = computeName("variables");
        return ts.factory.createBlock(
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
                    expr,
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
        );
      };
      if (query !== undefined && g.query.length === 0)
        return out(
          block(
            query.metadata.isRequired() === false
              ? ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier(query.name),
                  ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                  ts.factory.createObjectLiteralExpression([], false),
                )
              : ts.factory.createIdentifier(access(query.name)),
          ),
        );
      return out(
        block(
          ts.factory.createObjectLiteralExpression(
            [
              ...(query
                ? [
                    ts.factory.createSpreadAssignment(
                      ts.factory.createIdentifier(access(query.name)),
                    ),
                  ]
                : []),
              ...g.query.map((q) =>
                ts.factory.createPropertyAssignment(
                  Escaper.variable(q.field!)
                    ? q.field!
                    : ts.factory.createStringLiteral(q.field!),
                  ts.factory.createIdentifier(access(q.name)),
                ),
              ),
            ],
            true,
          ),
        ),
      );
    };

  const writeStringify =
    (project: INestiaProject) =>
    (importer: ImportDictionary): ts.VariableStatement =>
      constant("stringify")(
        ts.factory.createArrowFunction(
          [],
          undefined,
          [
            IdentifierFactory.parameter(
              "input",
              ts.factory.createTypeReferenceNode("RequestBody"),
            ),
          ],
          undefined,
          undefined,
          ts.factory.createCallExpression(
            IdentifierFactory.access(
              IdentifierFactory.access(
                ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
                "json",
              ),
              project.config.assert ? "stringify" : "assertStringify",
            ),
            undefined,
            [ts.factory.createIdentifier("input")],
          ),
        ),
      );
}

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
