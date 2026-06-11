import {
  Node,
  NodeFlags,
  SyntaxKind,
  TypeScriptFactory,
} from "@nestia/factory";

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
      const clientType = TypeScriptFactory.createTypeReferenceNode(
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
        ? TypeScriptFactory.createTypeReferenceNode(`${route.name}.Input`)
        : TypeScriptFactory.createTypeLiteralNode([]);
      const outputRef: Node = TypeScriptFactory.createTypeReferenceNode(
        `${route.name}.Output`,
      );

      const params: Node[] = [
        TypeScriptFactory.createParameterDeclaration(
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
          TypeScriptFactory.createParameterDeclaration(
            undefined,
            undefined,
            "args",
            undefined,
            inputRef,
            undefined,
          ),
        );

      const toolNameExpr = TypeScriptFactory.createPropertyAccessExpression(
        TypeScriptFactory.createPropertyAccessExpression(
          TypeScriptFactory.createIdentifier(route.name),
          "METADATA",
        ),
        "tool",
      );

      const callToolParams: Node[] = [
        TypeScriptFactory.createPropertyAssignment("name", toolNameExpr),
      ];
      if (route.input)
        callToolParams.push(
          TypeScriptFactory.createPropertyAssignment(
            "arguments",
            TypeScriptFactory.createAsExpression(
              TypeScriptFactory.createAsExpression(
                TypeScriptFactory.createIdentifier("args"),
                TypeScriptFactory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
              ),
              TypeScriptFactory.createTypeReferenceNode("Record", [
                TypeScriptFactory.createKeywordTypeNode(
                  SyntaxKind.StringKeyword,
                ),
                TypeScriptFactory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
              ]),
            ),
          ),
        );

      const body = TypeScriptFactory.createBlock(
        [
          TypeScriptFactory.createVariableStatement(
            undefined,
            TypeScriptFactory.createVariableDeclarationList(
              [
                TypeScriptFactory.createVariableDeclaration(
                  "raw",
                  undefined,
                  undefined,
                  TypeScriptFactory.createAwaitExpression(
                    TypeScriptFactory.createCallExpression(
                      TypeScriptFactory.createPropertyAccessExpression(
                        TypeScriptFactory.createIdentifier("client"),
                        "callTool",
                      ),
                      undefined,
                      [
                        TypeScriptFactory.createObjectLiteralExpression(
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
          TypeScriptFactory.createIfStatement(
            TypeScriptFactory.createCallExpression(
              TypeScriptFactory.createPropertyAccessExpression(
                TypeScriptFactory.createPropertyAccessExpression(
                  TypeScriptFactory.createPropertyAccessExpression(
                    TypeScriptFactory.createIdentifier("Object"),
                    "prototype",
                  ),
                  "hasOwnProperty",
                ),
                "call",
              ),
              undefined,
              [
                TypeScriptFactory.createIdentifier("raw"),
                TypeScriptFactory.createStringLiteral("toolResult"),
              ],
            ),
            throwToolError(
              toolNameExpr,
              '" returned a legacy (pre-2024-11-05) compatibility result',
            ),
          ),
          TypeScriptFactory.createVariableStatement(
            undefined,
            TypeScriptFactory.createVariableDeclarationList(
              [
                TypeScriptFactory.createVariableDeclaration(
                  "result",
                  undefined,
                  TypeScriptFactory.createTypeReferenceNode(
                    callToolResultTypeName,
                  ),
                  TypeScriptFactory.createAsExpression(
                    TypeScriptFactory.createIdentifier("raw"),
                    TypeScriptFactory.createTypeReferenceNode(
                      callToolResultTypeName,
                    ),
                  ),
                ),
              ],
              NodeFlags.Const,
            ),
          ),
          TypeScriptFactory.createIfStatement(
            TypeScriptFactory.createBinaryExpression(
              TypeScriptFactory.createPropertyAccessExpression(
                TypeScriptFactory.createIdentifier("result"),
                "isError",
              ),
              TypeScriptFactory.createToken(SyntaxKind.EqualsEqualsEqualsToken),
              TypeScriptFactory.createTrue(),
            ),
            throwToolError(toolNameExpr, '" returned isError'),
          ),
          ...(isVoid
            ? [TypeScriptFactory.createReturnStatement()]
            : [
                TypeScriptFactory.createVariableStatement(
                  undefined,
                  TypeScriptFactory.createVariableDeclarationList(
                    [
                      TypeScriptFactory.createVariableDeclaration(
                        "first",
                        undefined,
                        undefined,
                        TypeScriptFactory.createCallExpression(
                          TypeScriptFactory.createPropertyAccessExpression(
                            TypeScriptFactory.createPropertyAccessExpression(
                              TypeScriptFactory.createIdentifier("result"),
                              "content",
                            ),
                            "find",
                          ),
                          undefined,
                          [
                            TypeScriptFactory.createArrowFunction(
                              undefined,
                              undefined,
                              [],
                              undefined,
                              undefined,
                              TypeScriptFactory.createTrue(),
                            ),
                          ],
                        ),
                      ),
                    ],
                    NodeFlags.Const,
                  ),
                ),
                TypeScriptFactory.createIfStatement(
                  TypeScriptFactory.createBinaryExpression(
                    TypeScriptFactory.createIdentifier("first"),
                    TypeScriptFactory.createToken(
                      SyntaxKind.EqualsEqualsEqualsToken,
                    ),
                    TypeScriptFactory.createIdentifier("undefined"),
                  ),
                  throwToolError(toolNameExpr, '" returned no text content'),
                ),
                TypeScriptFactory.createIfStatement(
                  TypeScriptFactory.createBinaryExpression(
                    TypeScriptFactory.createPropertyAccessExpression(
                      TypeScriptFactory.createIdentifier("first"),
                      "type",
                    ),
                    TypeScriptFactory.createToken(
                      SyntaxKind.EqualsEqualsEqualsToken,
                    ),
                    TypeScriptFactory.createStringLiteral("text"),
                  ),
                  TypeScriptFactory.createReturnStatement(
                    TypeScriptFactory.createAsExpression(
                      TypeScriptFactory.createCallExpression(
                        TypeScriptFactory.createPropertyAccessExpression(
                          TypeScriptFactory.createIdentifier("JSON"),
                          "parse",
                        ),
                        undefined,
                        [
                          TypeScriptFactory.createPropertyAccessExpression(
                            TypeScriptFactory.createIdentifier("first"),
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

      return TypeScriptFactory.createFunctionDeclaration(
        [
          TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword),
          TypeScriptFactory.createModifier(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        params,
        TypeScriptFactory.createTypeReferenceNode("Promise", [outputRef]),
        body,
      );
    };

  const writeNamespace =
    (_project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): Node => {
      const statements: Node[] = [];

      if (route.input)
        statements.push(
          TypeScriptFactory.createTypeAliasDeclaration(
            [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
            "Input",
            undefined,
            TypeScriptFactory.createTypeReferenceNode(route.input.type.name),
          ),
        );

      const outputType: Node =
        !isVoidReturn(route) && route.returnType !== null
          ? TypeScriptFactory.createTypeReferenceNode(
              importer.external({
                declaration: true,
                file: "typia",
                type: "element",
                name: "Primitive",
              }),
              [
                TypeScriptFactory.createTypeReferenceNode(
                  unwrapPromise(route.returnType.name),
                ),
              ],
            )
          : TypeScriptFactory.createKeywordTypeNode(SyntaxKind.VoidKeyword);
      statements.push(
        TypeScriptFactory.createTypeAliasDeclaration(
          [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
          "Output",
          undefined,
          outputType,
        ),
      );

      statements.push(
        TypeScriptFactory.createVariableStatement(
          [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
          TypeScriptFactory.createVariableDeclarationList(
            [
              TypeScriptFactory.createVariableDeclaration(
                "METADATA",
                undefined,
                undefined,
                TypeScriptFactory.createAsExpression(
                  TypeScriptFactory.createObjectLiteralExpression(
                    [
                      TypeScriptFactory.createPropertyAssignment(
                        "protocol",
                        TypeScriptFactory.createStringLiteral("mcp"),
                      ),
                      TypeScriptFactory.createPropertyAssignment(
                        "tool",
                        TypeScriptFactory.createStringLiteral(route.toolName),
                      ),
                      TypeScriptFactory.createPropertyAssignment(
                        "title",
                        route.title === null
                          ? TypeScriptFactory.createNull()
                          : TypeScriptFactory.createStringLiteral(route.title),
                      ),
                      TypeScriptFactory.createPropertyAssignment(
                        "description",
                        route.toolDescription === null
                          ? TypeScriptFactory.createNull()
                          : TypeScriptFactory.createStringLiteral(
                              route.toolDescription,
                            ),
                      ),
                    ],
                    true,
                  ),
                  TypeScriptFactory.createTypeReferenceNode("const"),
                ),
              ),
            ],
            NodeFlags.Const,
          ),
        ),
      );

      return TypeScriptFactory.createModuleDeclaration(
        [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
        TypeScriptFactory.createIdentifier(route.name),
        TypeScriptFactory.createModuleBlock(statements),
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

  const throwToolError = (toolNameExpr: Node, suffix: string): Node =>
    TypeScriptFactory.createThrowStatement(
      TypeScriptFactory.createNewExpression(
        TypeScriptFactory.createIdentifier("Error"),
        undefined,
        [
          TypeScriptFactory.createTemplateExpression(
            TypeScriptFactory.createTemplateHead('MCP tool "'),
            [
              TypeScriptFactory.createTemplateSpan(
                toolNameExpr,
                TypeScriptFactory.createTemplateTail(suffix),
              ),
            ],
          ),
        ],
      ),
    );
}
