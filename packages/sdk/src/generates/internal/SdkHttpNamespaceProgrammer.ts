import {
  type Block,
  type Expression,
  type Node,
  NodeFlags,
  type ParameterDeclaration,
  type Statement,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";
import { NamingConvention } from "@typia/utils";

import { ExpressionFactory } from "../../factories/ExpressionFactory";
import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { LiteralFactory } from "../../factories/LiteralFactory";
import { TypeFactory } from "../../factories/TypeFactory";
import { sizeOf } from "../../internal/legacy";
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
    (route: ITypedHttpRoute): Node => {
      const types: Statement[] = writeTypes(project)(importer)(route);
      return factory.createModuleDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        factory.createIdentifier(route.name),
        factory.createModuleBlock([
          ...types,
          ...(types.length ? [FilePrinter.enter()] : []),
          writeMetadata(project)(importer)(route),
          FilePrinter.enter(),
          writePath(project)(importer)(route),
          ...(project.config.simulate
            ? [
                SdkHttpSimulationProgrammer.random(project)(importer)(
                  route,
                ) as Statement,
                SdkHttpSimulationProgrammer.simulate(project)(importer)(
                  route,
                ) as Statement,
              ]
            : []),
          ...(project.config.json &&
          route.body &&
          (route.body.contentType === "application/json" ||
            route.body.encrypted === true)
            ? [writeStringify(project)(importer)]
            : []),
        ]),
        NodeFlags.Namespace,
      );
    };

  const writeTypes =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Statement[] => {
      const array: Statement[] = [];
      const declare = (name: string, type: Node) =>
        array.push(
          factory.createTypeAliasDeclaration(
            [factory.createModifier(SyntaxKind.ExportKeyword)],
            name,
            undefined,
            type as TypeNode,
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
        route.success.binary === true ||
        sizeOf(route.success.metadata) !== 0
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
    (route: ITypedHttpRoute): Statement =>
      constant("METADATA")(
        factory.createAsExpression(
          factory.createObjectLiteralExpression(
            [
              factory.createPropertyAssignment(
                "method",
                factory.createStringLiteral(route.method),
              ),
              factory.createPropertyAssignment(
                "path",
                factory.createStringLiteral(route.path),
              ),
              factory.createPropertyAssignment(
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
                  : factory.createNull(),
              ),
              factory.createPropertyAssignment(
                "response",
                route.method !== "HEAD"
                  ? LiteralFactory.write({
                      type: route.success.contentType,
                      encrypted: !!route.success.encrypted,
                    })
                  : factory.createNull(),
              ),
              factory.createPropertyAssignment(
                "status",
                route.success.status !== null
                  ? ExpressionFactory.number(route.success.status)
                  : factory.createNull(),
              ),
              ...(route.success.contentType ===
              "application/x-www-form-urlencoded"
                ? [
                    factory.createPropertyAssignment(
                      "parseQuery",
                      factory.createCallExpression(
                        factory.createIdentifier(
                          `${SdkImportWizard.typia(importer)}.http.createAssertQuery`,
                        ),
                        [
                          (project.config.clone === true
                            ? SdkAliasCollection.from(project)(importer)(
                                route.success.metadata,
                              )
                            : SdkAliasCollection.name(
                                route.success,
                              )) as TypeNode,
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

  const writePath =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Statement => {
      const out = (body: Block | Expression) =>
        constant("path")(
          factory.createArrowFunction(
            [],
            [],
            SdkHttpParameterProgrammer.getParameterDeclarations({
              project,
              importer,
              route,
              body: false,
              prefix: false,
            }) as ParameterDeclaration[],
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
        return out(factory.createStringLiteral(route.path));

      const access = (name: string) =>
        project.config.keyword === true ? `props.${name}` : name;
      const template = () => {
        const split: string[] = route.path.split(":");
        if (split.length === 1) return factory.createStringLiteral(route.path);
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
                    factory.createCallChain(
                      factory.createPropertyAccessChain(
                        factory.createIdentifier(
                          access(
                            route.pathParameters.find((p) => p.field === name)!
                              .name,
                          ),
                        ),
                        factory.createToken(SyntaxKind.QuestionDotToken),
                        "toString",
                      ),
                      undefined,
                      undefined,
                      [],
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
      if (route.queryObject === null && route.queryParameters.length === 0)
        return out(template());

      const block = (expr: Expression) => {
        const computeName = (str: string): string =>
          parameters.find((p) => p.name === str) !== undefined
            ? computeName("_" + str)
            : str;
        const variables: string = computeName("variables");
        return factory.createBlock(
          [
            local(variables)("URLSearchParams")(
              factory.createNewExpression(
                factory.createIdentifier("URLSearchParams"),
                [],
                [],
              ),
            ),
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
                [factory.createAsExpression(expr, TypeFactory.keyword("any"))],
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
            local("location")("string")(template()),
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
                factory.createTemplateExpression(
                  factory.createTemplateHead(""),
                  [
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
            route.queryObject.metadata.required === false
              ? factory.createBinaryExpression(
                  factory.createIdentifier(route.queryObject.name),
                  factory.createToken(SyntaxKind.QuestionQuestionToken),
                  factory.createObjectLiteralExpression([], false),
                )
              : factory.createIdentifier(access(route.queryObject.name)),
          ),
        );
      return out(
        block(
          factory.createObjectLiteralExpression(
            [
              ...(route.queryObject
                ? [
                    factory.createSpreadAssignment(
                      factory.createIdentifier(access(route.queryObject.name)),
                    ),
                  ]
                : []),
              ...route.queryParameters.map((q) =>
                factory.createPropertyAssignment(
                  NamingConvention.variable(q.field!)
                    ? q.field!
                    : factory.createStringLiteral(q.field!),
                  factory.createIdentifier(access(q.name)),
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
    (importer: ImportDictionary): Statement =>
      constant("stringify")(
        factory.createArrowFunction(
          [],
          undefined,
          [
            IdentifierFactory.parameter(
              "input",
              factory.createTypeReferenceNode("Body"),
            ),
          ],
          undefined,
          undefined,
          factory.createCallExpression(
            IdentifierFactory.access(
              IdentifierFactory.access(
                factory.createIdentifier(SdkImportWizard.typia(importer)),
                "json",
              ),
              project.config.assert ? "stringify" : "assertStringify",
            ),
            undefined,
            [factory.createIdentifier("input")],
          ),
        ),
      );
}

const local = (name: string) => (type: string) => (expression: Expression) =>
  factory.createVariableStatement(
    [],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          name,
          undefined,
          factory.createTypeReferenceNode(type),
          expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );
const constant = (name: string) => (expression: Expression) =>
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
