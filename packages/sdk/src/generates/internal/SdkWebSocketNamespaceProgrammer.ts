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
import { SdkPathTemplate } from "./SdkPathTemplate";
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
        declare(
          "Props",
          SdkAliasCollection.websocketProps(
            route,
            SdkWebSocketParameterProgrammer.getNames({ project, route }),
          ),
        );
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
      const names: SdkWebSocketParameterProgrammer.INames =
        SdkWebSocketParameterProgrammer.getNames({ project, route });
      const template = () =>
        SdkPathTemplate.compose({
          path: route.path,
          argument: (name) =>
            names.access(
              names.parameter(
                route.pathParameters.find((p) => p.field === name)!,
              ),
            ),
        });
      if (route.query === null) return out(template());

      const block = (expr: Expression) => {
        const variables: string = names.variables;
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
                        factory.createIdentifier(names.key),
                        undefined,
                      ),
                      factory.createBindingElement(
                        undefined,
                        undefined,
                        factory.createIdentifier(names.value),
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
                  factory.createIdentifier(names.value),
                ),
                factory.createContinueStatement(),
                factory.createIfStatement(
                  factory.createCallExpression(
                    factory.createIdentifier("Array.isArray"),
                    undefined,
                    [factory.createIdentifier(names.value)],
                  ),
                  factory.createExpressionStatement(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier(names.value),
                        factory.createIdentifier("forEach"),
                      ),
                      undefined,
                      [
                        factory.createArrowFunction(
                          undefined,
                          undefined,
                          [IdentifierFactory.parameter(names.elem)],
                          undefined,
                          undefined,
                          factory.createCallExpression(
                            IdentifierFactory.access(
                              factory.createIdentifier(variables),
                              "append",
                            ),
                            undefined,
                            [
                              factory.createIdentifier(names.key),
                              factory.createCallExpression(
                                factory.createIdentifier("String"),
                                undefined,
                                [factory.createIdentifier(names.elem)],
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
                        factory.createIdentifier(names.key),
                        factory.createCallExpression(
                          factory.createIdentifier("String"),
                          undefined,
                          [factory.createIdentifier(names.value)],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            local(names.location)("string")(template()),
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
                factory.createIdentifier(names.location),
                undefined,
                factory.createTemplateExpression(
                  factory.createTemplateHead(""),
                  [
                    factory.createTemplateSpan(
                      factory.createIdentifier(names.location),
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
      return out(block(names.access(names.query)));
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
