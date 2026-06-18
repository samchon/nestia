import {
  type Block,
  type Expression,
  NodeFlags,
  type Statement,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { ExpressionFactory } from "../../factories/ExpressionFactory";
import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { TypeFactory } from "../../factories/TypeFactory";
import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkWebSocketParameterProgrammer } from "./SdkWebSocketParameterProgrammer";

export namespace SdkWebSocketNamespaceProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): Statement =>
      factory.createModuleDeclaration(
        [factory.createToken(SyntaxKind.ExportKeyword)],
        factory.createIdentifier(route.name),
        factory.createModuleBlock([
          ...writeTypes(project)(importer)(route),
          FilePrinter.enter(),
          writePath(project)(route),
        ]),
        NodeFlags.Namespace,
      );

  const writeTypes =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): Statement[] => {
      const output: Statement[] = [];
      const declare = (name: string, type: TypeNode) =>
        output.push(
          factory.createTypeAliasDeclaration(
            [factory.createModifier(SyntaxKind.ExportKeyword)],
            name,
            undefined,
            type,
          ),
        );

      if (project.config.keyword === true)
        declare("Props", SdkAliasCollection.websocketProps(route));
      declare(
        "Output",
        factory.createTypeLiteralNode([
          factory.createPropertySignature(
            undefined,
            "connector",
            undefined,
            factory.createTypeReferenceNode(
              importer.external({
                declaration: false,
                file: "tgrid",
                type: "element",
                name: "WebSocketConnector",
              }),
              [
                factory.createTypeReferenceNode("Header"),
                factory.createTypeReferenceNode("Provider"),
                factory.createTypeReferenceNode("Listener"),
              ],
            ),
          ),
          factory.createPropertySignature(
            undefined,
            "driver",
            undefined,
            factory.createTypeReferenceNode(
              importer.external({
                declaration: true,
                file: "tgrid",
                type: "element",
                name: "Driver",
              }),
              [factory.createTypeReferenceNode("Listener")],
            ),
          ),
          factory.createPropertySignature(
            undefined,
            "reconnect",
            undefined,
            factory.createFunctionTypeNode(
              undefined,
              [],
              factory.createTypeReferenceNode(
                factory.createIdentifier("Promise"),
                [factory.createKeywordTypeNode(SyntaxKind.VoidKeyword)],
              ),
            ),
          ),
        ]),
      );

      declare(
        "Header",
        SdkAliasCollection.name({
          type: (route.header?.type ?? route.acceptor.type.typeArguments?.[0])!,
        }),
      );
      declare(
        "Provider",
        SdkAliasCollection.name({
          type:
            route.driver?.type.typeArguments?.[0] ??
            route.acceptor.type.typeArguments?.[2]!,
        }),
      );
      declare(
        "Listener",
        SdkAliasCollection.name({
          type: route.acceptor.type.typeArguments?.[1]!,
        }),
      );
      if (route.query) declare("Query", SdkAliasCollection.name(route.query));
      return output;
    };

  const writePath =
    (project: INestiaProject) =>
    (route: ITypedWebSocketRoute): Statement => {
      const out = (body: Block | Expression) =>
        constant("path")(
          factory.createArrowFunction(
            [],
            [],
            SdkWebSocketParameterProgrammer.getParameterDeclarations({
              project,
              route,
              provider: false,
              prefix: false,
            }),
            undefined,
            undefined,
            body,
          ),
        );
      if (route.pathParameters.length === 0 && route.query === null)
        return out(factory.createStringLiteral(route.path));

      const access = (key: string) =>
        project.config.keyword === true
          ? factory.createPropertyAccessExpression(
              factory.createIdentifier("props"),
              key,
            )
          : factory.createIdentifier(key);
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
                        access(
                          route.pathParameters.find((p) => p.field === name)!
                            .name,
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
      if (route.query === null) return out(template());

      const block = (expr: Expression) => {
        const computeName = (str: string): string =>
          [...route.pathParameters, ...(route.query ? [route.query] : [])].find(
            (p) => p.name === str,
          ) !== undefined
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
      return out(block(access(route.query.name)));
    };
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
