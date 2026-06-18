import {
  type Expression,
  type Node,
  NodeFlags,
  type ObjectLiteralElement,
  type ParameterDeclaration,
  type Statement,
  SyntaxKind,
  factory,
} from "@ttsc/factory";

import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedMcpRoute } from "../../structures/ITypedMcpRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";

/**
 * Emits a typed client wrapper for an MCP tool.
 *
 * Object output types are wrapped in `Primitive<T>` because MCP round-trips
 * values through JSON. Void MCP tools return `Promise<void>`.
 *
 * @author wildduck - https://github.com/wildduck2
 */
export namespace SdkMcpRouteProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): Node[] => [
      FilePrinter.description(
        writeFunction(project)(importer)(route),
        writeDescription(route),
      ),
      writeNamespace(project)(importer)(route),
    ];

  const writeFunction =
    (_project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): Node => {
      const clientType = factory.createTypeReferenceNode(
        importer.external({
          declaration: true,
          file: "@modelcontextprotocol/sdk/client/index.js",
          type: "element",
          name: "Client",
          alias: "McpClient",
        }),
      );
      const callToolResultTypeName = importer.external({
        declaration: true,
        file: "@modelcontextprotocol/sdk/types.js",
        type: "element",
        name: "CallToolResult",
        alias: "McpCallToolResult",
      });
      const isVoid = isVoidReturn(route);
      if (!isVoid)
        importer.external({
          declaration: true,
          file: "typia",
          type: "element",
          name: "Primitive",
        });

      const inputRef: Node = route.input
        ? factory.createTypeReferenceNode(`${route.name}.Input`)
        : factory.createTypeLiteralNode([]);
      const outputRef: Node = factory.createTypeReferenceNode(
        `${route.name}.Output`,
      );

      const params: ParameterDeclaration[] = [
        factory.createParameterDeclaration(
          undefined,
          undefined,
          "client",
          undefined,
          clientType,
          undefined,
        ),
      ];
      if (route.input)
        params.push(
          factory.createParameterDeclaration(
            undefined,
            undefined,
            "args",
            undefined,
            inputRef,
            undefined,
          ),
        );

      const toolNameExpr = factory.createPropertyAccessExpression(
        factory.createPropertyAccessExpression(
          factory.createIdentifier(route.name),
          "METADATA",
        ),
        "tool",
      );

      const callToolParams: ObjectLiteralElement[] = [
        factory.createPropertyAssignment("name", toolNameExpr),
      ];
      if (route.input)
        callToolParams.push(
          factory.createPropertyAssignment(
            "arguments",
            factory.createAsExpression(
              factory.createAsExpression(
                factory.createIdentifier("args"),
                factory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
              ),
              factory.createTypeReferenceNode("Record", [
                factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
                factory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
              ]),
            ),
          ),
        );

      const body = factory.createBlock(
        [
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  "raw",
                  undefined,
                  undefined,
                  factory.createAwaitExpression(
                    factory.createCallExpression(
                      factory.createPropertyAccessExpression(
                        factory.createIdentifier("client"),
                        "callTool",
                      ),
                      undefined,
                      [
                        factory.createObjectLiteralExpression(
                          callToolParams,
                          true,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              NodeFlags.Const,
            ),
          ),
          factory.createIfStatement(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("Object"),
                    "prototype",
                  ),
                  "hasOwnProperty",
                ),
                "call",
              ),
              undefined,
              [
                factory.createIdentifier("raw"),
                factory.createStringLiteral("toolResult"),
              ],
            ),
            throwToolError(
              toolNameExpr,
              '" returned a legacy (pre-2024-11-05) compatibility result',
            ),
          ),
          factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  "result",
                  undefined,
                  factory.createTypeReferenceNode(callToolResultTypeName),
                  factory.createAsExpression(
                    factory.createIdentifier("raw"),
                    factory.createTypeReferenceNode(callToolResultTypeName),
                  ),
                ),
              ],
              NodeFlags.Const,
            ),
          ),
          factory.createIfStatement(
            factory.createBinaryExpression(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("result"),
                "isError",
              ),
              factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
              factory.createTrue(),
            ),
            throwToolError(toolNameExpr, '" returned isError'),
          ),
          ...(isVoid
            ? [factory.createReturnStatement()]
            : [
                factory.createVariableStatement(
                  undefined,
                  factory.createVariableDeclarationList(
                    [
                      factory.createVariableDeclaration(
                        "first",
                        undefined,
                        undefined,
                        factory.createCallExpression(
                          factory.createPropertyAccessExpression(
                            factory.createPropertyAccessExpression(
                              factory.createIdentifier("result"),
                              "content",
                            ),
                            "find",
                          ),
                          undefined,
                          [
                            factory.createArrowFunction(
                              undefined,
                              undefined,
                              [IdentifierFactory.parameter("entry")],
                              undefined,
                              undefined,
                              factory.createBinaryExpression(
                                factory.createPropertyAccessExpression(
                                  factory.createIdentifier("entry"),
                                  "type",
                                ),
                                factory.createToken(
                                  SyntaxKind.EqualsEqualsEqualsToken,
                                ),
                                factory.createStringLiteral("text"),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    NodeFlags.Const,
                  ),
                ),
                factory.createIfStatement(
                  factory.createBinaryExpression(
                    factory.createIdentifier("first"),
                    factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
                    factory.createIdentifier("undefined"),
                  ),
                  throwToolError(toolNameExpr, '" returned no text content'),
                ),
                factory.createIfStatement(
                  factory.createBinaryExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("first"),
                      "type",
                    ),
                    factory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
                    factory.createStringLiteral("text"),
                  ),
                  factory.createReturnStatement(
                    factory.createAsExpression(
                      factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                          factory.createIdentifier("JSON"),
                          "parse",
                        ),
                        undefined,
                        [
                          factory.createPropertyAccessExpression(
                            factory.createIdentifier("first"),
                            "text",
                          ),
                        ],
                      ),
                      outputRef,
                    ),
                  ),
                ),
                throwToolError(toolNameExpr, '" returned no text content'),
              ]),
        ],
        true,
      );

      return factory.createFunctionDeclaration(
        [
          factory.createModifier(SyntaxKind.ExportKeyword),
          factory.createModifier(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        params,
        factory.createTypeReferenceNode("Promise", [outputRef]),
        body,
      );
    };

  const writeNamespace =
    (_project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): Node => {
      const statements: Statement[] = [];

      if (route.input)
        statements.push(
          factory.createTypeAliasDeclaration(
            [factory.createModifier(SyntaxKind.ExportKeyword)],
            "Input",
            undefined,
            factory.createTypeReferenceNode(route.input.type.name),
          ),
        );

      const outputType: Node =
        !isVoidReturn(route) && route.returnType !== null
          ? factory.createTypeReferenceNode(
              importer.external({
                declaration: true,
                file: "typia",
                type: "element",
                name: "Primitive",
              }),
              [
                factory.createTypeReferenceNode(
                  unwrapPromise(route.returnType.name),
                ),
              ],
            )
          : factory.createKeywordTypeNode(SyntaxKind.VoidKeyword);
      statements.push(
        factory.createTypeAliasDeclaration(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          "Output",
          undefined,
          outputType,
        ),
      );

      statements.push(
        factory.createVariableStatement(
          [factory.createModifier(SyntaxKind.ExportKeyword)],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                "METADATA",
                undefined,
                undefined,
                factory.createAsExpression(
                  factory.createObjectLiteralExpression(
                    [
                      factory.createPropertyAssignment(
                        "protocol",
                        factory.createStringLiteral("mcp"),
                      ),
                      factory.createPropertyAssignment(
                        "tool",
                        factory.createStringLiteral(route.toolName),
                      ),
                      factory.createPropertyAssignment(
                        "title",
                        route.title === null
                          ? factory.createNull()
                          : factory.createStringLiteral(route.title),
                      ),
                      factory.createPropertyAssignment(
                        "description",
                        route.toolDescription === null
                          ? factory.createNull()
                          : factory.createStringLiteral(route.toolDescription),
                      ),
                    ],
                    true,
                  ),
                  factory.createTypeReferenceNode("const"),
                ),
              ),
            ],
            NodeFlags.Const,
          ),
        ),
      );

      return factory.createModuleDeclaration(
        [factory.createModifier(SyntaxKind.ExportKeyword)],
        factory.createIdentifier(route.name),
        factory.createModuleBlock(statements),
        NodeFlags.Namespace,
      );
    };

  const writeDescription = (route: ITypedMcpRoute): string => {
    const lines: string[] = [];
    if (route.toolDescription) lines.push(...route.toolDescription.split("\n"));
    else if (route.description) lines.push(...route.description.split("\n"));
    if (lines.length) lines.push("");
    lines.push(
      `@controller ${route.controller.class.name}.${route.function.name || route.name}`,
      `@tool ${route.toolName}`,
      `@accessor ${["api", "functional", ...route.accessor].join(".")}`,
      `@protocol mcp`,
      `@nestia Generated by Nestia - https://github.com/samchon/nestia`,
    );
    return lines.join("\n");
  };

  const unwrapPromise = (name: string): string => {
    const m = /^Promise<(.+)>$/.exec(name);
    return m ? m[1]! : name;
  };

  const isVoidReturn = (route: ITypedMcpRoute): boolean =>
    route.returnType === null ||
    isVoidName(unwrapPromise(route.returnType.name));

  const isVoidName = (name: string): boolean =>
    name === "void" || name === "undefined";

  const throwToolError = (
    toolNameExpr: Expression,
    suffix: string,
  ): Statement =>
    factory.createThrowStatement(
      factory.createNewExpression(
        factory.createIdentifier("Error"),
        undefined,
        [
          factory.createTemplateExpression(
            factory.createTemplateHead('MCP tool "'),
            [
              factory.createTemplateSpan(
                toolNameExpr,
                factory.createTemplateTail(suffix),
              ),
            ],
          ),
        ],
      ),
    );
}
