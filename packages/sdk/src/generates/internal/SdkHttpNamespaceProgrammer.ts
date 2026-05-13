import { TypeScriptFactory } from "@nestia/factory";
import {
  ExpressionFactory,
  IdentifierFactory,
  LiteralFactory,
  TypeFactory,
} from "@typia/core";
import { NamingConvention } from "@typia/utils";
import ts from "typescript";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkHttpSimulationProgrammer } from "./SdkHttpSimulationProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkHttpNamespaceProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.ModuleDeclaration => {
      const types: ts.TypeAliasDeclaration[] =
        writeTypes(project)(importer)(route);
      return TypeScriptFactory.createModuleDeclaration(
        [TypeScriptFactory.createToken(ts.SyntaxKind.ExportKeyword)],
        TypeScriptFactory.createIdentifier(route.name),
        TypeScriptFactory.createModuleBlock([
          ...types,
          ...(types.length ? [FilePrinter.enter()] : []),
          writeMetadata(project)(importer)(route),
          FilePrinter.enter(),
          writePath(project)(importer)(route),
          ...(project.config.simulate
            ? [
                SdkHttpSimulationProgrammer.random(project)(importer)(route),
                SdkHttpSimulationProgrammer.simulate(project)(importer)(route),
              ]
            : []),
          ...(project.config.json &&
          route.body &&
          (route.body.contentType === "application/json" ||
            route.body.encrypted === true)
            ? [writeStringify(project)(importer)]
            : []),
        ]),
        ts.NodeFlags.Namespace,
      );
    };

  const writeTypes =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.TypeAliasDeclaration[] => {
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
        project.config.keyword === true &&
        SdkHttpParameterProgrammer.getSignificant(route, true).length !== 0
      )
        declare(
          "Props",
          SdkAliasCollection.httpProps(project)(importer)(route),
        );
      if (route.headerObject)
        declare(
          "Headers",
          SdkAliasCollection.headers(project)(importer)(route.headerObject),
        );
      if (route.queryObject)
        declare(
          "Query",
          SdkAliasCollection.query(project)(importer)(route.queryObject),
        );
      if (route.body)
        declare("Body", SdkAliasCollection.body(project)(importer)(route.body));
      if (
        project.config.propagate === true ||
        route.success.metadata.size() !== 0
      )
        declare(
          "Output",
          SdkAliasCollection.response(project)(importer)(route),
        );
      return array;
    };

  const writeMetadata =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.VariableStatement =>
      constant("METADATA")(
        TypeScriptFactory.createAsExpression(
          TypeScriptFactory.createObjectLiteralExpression(
            [
              TypeScriptFactory.createPropertyAssignment(
                "method",
                TypeScriptFactory.createStringLiteral(route.method),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "path",
                TypeScriptFactory.createStringLiteral(route.path),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "request",
                route.body
                  ? LiteralFactory.write(
                      route.body !== undefined
                        ? {
                            type: route.body.contentType,
                            encrypted: !!route.body.encrypted,
                          }
                        : {
                            type: "application/json",
                            encrypted: false,
                          },
                    )
                  : TypeScriptFactory.createNull(),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "response",
                route.method !== "HEAD"
                  ? LiteralFactory.write({
                      type: route.success.contentType,
                      encrypted: !!route.success.encrypted,
                    })
                  : TypeScriptFactory.createNull(),
              ),
              TypeScriptFactory.createPropertyAssignment(
                "status",
                route.success.status !== null
                  ? ExpressionFactory.number(route.success.status)
                  : TypeScriptFactory.createNull(),
              ),
              ...(route.success.contentType ===
              "application/x-www-form-urlencoded"
                ? [
                    TypeScriptFactory.createPropertyAssignment(
                      "parseQuery",
                      TypeScriptFactory.createCallExpression(
                        TypeScriptFactory.createIdentifier(
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
          TypeScriptFactory.createTypeReferenceNode(
            TypeScriptFactory.createIdentifier("const"),
          ),
        ),
      );

  const writePath =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.VariableStatement => {
      const out = (body: ts.ConciseBody) =>
        constant("path")(
          TypeScriptFactory.createArrowFunction(
            [],
            [],
            SdkHttpParameterProgrammer.getParameterDeclarations({
              project,
              importer,
              route,
              body: false,
              prefix: false,
            }),
            undefined,
            undefined,
            body,
          ),
        );
      const parameters = SdkHttpParameterProgrammer.getSignificant(
        route,
        false,
      );
      if (parameters.length === 0)
        return out(TypeScriptFactory.createStringLiteral(route.path));

      const access = (name: string) =>
        project.config.keyword === true ? `props.${name}` : name;
      const template = () => {
        const split: string[] = route.path.split(":");
        if (split.length === 1)
          return TypeScriptFactory.createStringLiteral(route.path);
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
                    TypeScriptFactory.createCallChain(
                      TypeScriptFactory.createPropertyAccessChain(
                        TypeScriptFactory.createIdentifier(
                          access(
                            route.pathParameters.find((p) => p.field === name)!
                              .name,
                          ),
                        ),
                        TypeScriptFactory.createToken(
                          ts.SyntaxKind.QuestionDotToken,
                        ),
                        "toString",
                      ),
                      undefined,
                      undefined,
                      [],
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
                : TypeScriptFactory.createTemplateTail)(
                s.substring(name.length),
              ),
            );
          }),
        );
      };
      if (route.queryObject === null && route.queryParameters.length === 0)
        return out(template());

      const block = (expr: ts.Expression) => {
        const computeName = (str: string): string =>
          parameters.find((p) => p.name === str) !== undefined
            ? computeName("_" + str)
            : str;
        const variables: string = computeName("variables");
        return TypeScriptFactory.createBlock(
          [
            local(variables)("URLSearchParams")(
              TypeScriptFactory.createNewExpression(
                TypeScriptFactory.createIdentifier("URLSearchParams"),
                [],
                [],
              ),
            ),
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
                    expr,
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
            local("location")("string")(template()),
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
        );
      };
      if (route.queryObject !== null && route.queryParameters.length === 0)
        return out(
          block(
            route.queryObject.metadata.isRequired() === false
              ? TypeScriptFactory.createBinaryExpression(
                  TypeScriptFactory.createIdentifier(route.queryObject.name),
                  TypeScriptFactory.createToken(
                    ts.SyntaxKind.QuestionQuestionToken,
                  ),
                  TypeScriptFactory.createObjectLiteralExpression([], false),
                )
              : TypeScriptFactory.createIdentifier(
                  access(route.queryObject.name),
                ),
          ),
        );
      return out(
        block(
          TypeScriptFactory.createObjectLiteralExpression(
            [
              ...(route.queryObject
                ? [
                    TypeScriptFactory.createSpreadAssignment(
                      TypeScriptFactory.createIdentifier(
                        access(route.queryObject.name),
                      ),
                    ),
                  ]
                : []),
              ...route.queryParameters.map((q) =>
                TypeScriptFactory.createPropertyAssignment(
                  NamingConvention.variable(q.field!)
                    ? q.field!
                    : TypeScriptFactory.createStringLiteral(q.field!),
                  TypeScriptFactory.createIdentifier(access(q.name)),
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
        TypeScriptFactory.createArrowFunction(
          [],
          undefined,
          [
            IdentifierFactory.parameter(
              "input",
              TypeScriptFactory.createTypeReferenceNode("Body"),
            ),
          ],
          undefined,
          undefined,
          TypeScriptFactory.createCallExpression(
            IdentifierFactory.access(
              IdentifierFactory.access(
                TypeScriptFactory.createIdentifier(
                  SdkImportWizard.typia(importer),
                ),
                "json",
              ),
              project.config.assert ? "stringify" : "assertStringify",
            ),
            undefined,
            [TypeScriptFactory.createIdentifier("input")],
          ),
        ),
      );
}

const local = (name: string) => (type: string) => (expression: ts.Expression) =>
  TypeScriptFactory.createVariableStatement(
    [],
    TypeScriptFactory.createVariableDeclarationList(
      [
        TypeScriptFactory.createVariableDeclaration(
          name,
          undefined,
          TypeScriptFactory.createTypeReferenceNode(type),
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
const constant = (name: string) => (expression: ts.Expression) =>
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
