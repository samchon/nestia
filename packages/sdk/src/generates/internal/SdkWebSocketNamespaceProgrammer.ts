import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

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
    (route: ITypedWebSocketRoute): ts.ModuleDeclaration =>
      ts.factory.createModuleDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(route.name),
        ts.factory.createModuleBlock([
          ...writeTypes(project)(importer)(route),
          FilePrinter.enter(),
          writePath(project)(route),
        ]),
        ts.NodeFlags.Namespace,
      );

  const writeTypes =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.TypeAliasDeclaration[] => {
      const output: ts.TypeAliasDeclaration[] = [];
      const declare = (name: string, type: ts.TypeNode) =>
        output.push(
          ts.factory.createTypeAliasDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            name,
            undefined,
            type,
          ),
        );

      if (project.config.keyword === true)
        declare("Props", SdkAliasCollection.websocketProps(route));
      declare(
        "Output",
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            "connector",
            undefined,
            ts.factory.createTypeReferenceNode(
              importer.external({
                type: false,
                library: "tgrid",
                instance: "WebSocketConnector",
              }),
              [
                ts.factory.createTypeReferenceNode("Header"),
                ts.factory.createTypeReferenceNode("Provider"),
                ts.factory.createTypeReferenceNode("Listener"),
              ],
            ),
          ),
          ts.factory.createPropertySignature(
            undefined,
            "driver",
            undefined,
            ts.factory.createTypeReferenceNode(
              importer.external({
                type: true,
                library: "tgrid",
                instance: "Driver",
              }),
              [ts.factory.createTypeReferenceNode("Listener")],
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
    (route: ITypedWebSocketRoute): ts.VariableStatement => {
      const out = (body: ts.ConciseBody) =>
        constant("path")(
          ts.factory.createArrowFunction(
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
        return out(ts.factory.createStringLiteral(route.path));

      const access = (key: string) =>
        project.config.keyword === true
          ? ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("props"),
              key,
            )
          : ts.factory.createIdentifier(key);
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
                        access(
                          route.pathParameters.find((p) => p.field === name)!
                            .name,
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
      if (route.query === null) return out(template());

      const block = (expr: ts.Expression) => {
        const computeName = (str: string): string =>
          [...route.pathParameters, ...(route.query ? [route.query] : [])].find(
            (p) => p.name === str,
          ) !== undefined
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
      return out(block(access(route.query.name)));
    };
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
