import { Node, NodeFlags, SyntaxKind, TypeScriptFactory } from "@nestia/factory";
import { ExpressionFactory, IdentifierFactory, TypeFactory } from "@typia/core";

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
    (route: ITypedWebSocketRoute): Node =>
      TypeScriptFactory.createModuleDeclaration(
        [TypeScriptFactory.createToken(SyntaxKind.ExportKeyword)],
        TypeScriptFactory.createIdentifier(route.name),
        TypeScriptFactory.createModuleBlock([
          ...writeTypes(project)(importer)(route),
          FilePrinter.enter(),
          writePath(project)(route),
        ]),
        NodeFlags.Namespace,
      );

  const writeTypes =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): Node[] => {
      const output: Node[] = [];
      const declare = (name: string, type: Node) =>
        output.push(
          TypeScriptFactory.createTypeAliasDeclaration(
            [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
            name,
            undefined,
            type,
          ),
        );

      if (project.config.keyword === true)
        declare("Props", SdkAliasCollection.websocketProps(route));
      declare(
        "Output",
        TypeScriptFactory.createTypeLiteralNode([
          TypeScriptFactory.createPropertySignature(
            undefined,
            "connector",
            undefined,
            TypeScriptFactory.createTypeReferenceNode(
              importer.external({
                declaration: false,
                file: "tgrid",
                type: "element",
                name: "WebSocketConnector",
              }),
              [
                TypeScriptFactory.createTypeReferenceNode("Header"),
                TypeScriptFactory.createTypeReferenceNode("Provider"),
                TypeScriptFactory.createTypeReferenceNode("Listener"),
              ],
            ),
          ),
          TypeScriptFactory.createPropertySignature(
            undefined,
            "driver",
            undefined,
            TypeScriptFactory.createTypeReferenceNode(
              importer.external({
                declaration: true,
                file: "tgrid",
                type: "element",
                name: "Driver",
              }),
              [TypeScriptFactory.createTypeReferenceNode("Listener")],
            ),
          ),
          TypeScriptFactory.createPropertySignature(
            undefined,
            "reconnect",
            undefined,
            TypeScriptFactory.createFunctionTypeNode(
              undefined,
              [],
              TypeScriptFactory.createTypeReferenceNode(
                TypeScriptFactory.createIdentifier("Promise"),
                [
                  TypeScriptFactory.createKeywordTypeNode(
                    SyntaxKind.VoidKeyword,
                  ),
                ],
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
    (route: ITypedWebSocketRoute): Node => {
      const out = (body: Node) =>
        constant("path")(
          TypeScriptFactory.createArrowFunction(
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
        return out(TypeScriptFactory.createStringLiteral(route.path));

      const access = (key: string) =>
        project.config.keyword === true
          ? TypeScriptFactory.createPropertyAccessExpression(
              TypeScriptFactory.createIdentifier("props"),
              key,
            )
          : TypeScriptFactory.createIdentifier(key);
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
                        access(
                          route.pathParameters.find((p) => p.field === name)!
                            .name,
                        ),
                        TypeScriptFactory.createToken(
                          SyntaxKind.QuestionDotToken,
                        ),
                        "toString",
                      ),
                      undefined,
                      undefined,
                      [],
                    ),
                    TypeScriptFactory.createToken(
                      SyntaxKind.QuestionQuestionToken,
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
      if (route.query === null) return out(template());

      const block = (expr: Node) => {
        const computeName = (str: string): string =>
          [...route.pathParameters, ...(route.query ? [route.query] : [])].find(
            (p) => p.name === str,
          ) !== undefined
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
                NodeFlags.Const,
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
      return out(block(access(route.query.name)));
    };
}

const local = (name: string) => (type: string) => (expression: Node) =>
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
      NodeFlags.Const,
    ),
  );
const constant = (name: string) => (expression: Node) =>
  TypeScriptFactory.createVariableStatement(
    [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
    TypeScriptFactory.createVariableDeclarationList(
      [
        TypeScriptFactory.createVariableDeclaration(
          name,
          undefined,
          undefined,
          expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );
