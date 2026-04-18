import ts from "typescript";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedMcpRoute } from "../../structures/ITypedMcpRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";

/**
 * Emits a typed client wrapper for an MCP tool.
 *
 * Output mirrors `SdkHttpRouteProgrammer` conventions: a top-level async
 * function paired with a namespace that exposes `Input`, `Output`, and
 * `METADATA`. The output type is wrapped in `Primitive<T>` from typia — MCP
 * round-trips values through JSON, which matches the semantics of `Primitive`.
 *
 * The response is typed via `CallToolResult` from `@modelcontextprotocol/sdk`
 * and narrowed structurally (`isError === true`, `type === "text"`) rather than
 * asserted with `as any`. The single unavoidable cast is on the `arguments`
 * field of `client.callTool(...)`, which the MCP SDK types as `Record<string,
 * unknown> | undefined`; a user interface without an index signature is not
 * structurally assignable to that record.
 */
export namespace SdkMcpRouteProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): ts.Statement[] => [
      FilePrinter.description(
        writeFunction(project)(importer)(route),
        writeDescription(route),
      ),
      writeNamespace(project)(importer)(route),
    ];

  /* ---------------------------------------------------------
    FUNCTION
  --------------------------------------------------------- */
  const writeFunction =
    (_project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): ts.FunctionDeclaration => {
      const clientType = ts.factory.createTypeReferenceNode(
        importer.external({
          declaration: true,
          file: "@modelcontextprotocol/sdk/client/index.js",
          type: "element",
          name: "Client",
        }),
      );
      const callToolResultTypeName = importer.external({
        declaration: true,
        file: "@modelcontextprotocol/sdk/types.js",
        type: "element",
        name: "CallToolResult",
      });
      // Register Primitive import so Output type resolves.
      if (route.returnType !== null)
        importer.external({
          declaration: true,
          file: "typia",
          type: "element",
          name: "Primitive",
        });

      const inputRef: ts.TypeNode = route.input
        ? ts.factory.createTypeReferenceNode(`${route.name}.Input`)
        : ts.factory.createTypeLiteralNode([]);
      const outputRef: ts.TypeNode = ts.factory.createTypeReferenceNode(
        `${route.name}.Output`,
      );

      const params: ts.ParameterDeclaration[] = [
        ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          "client",
          undefined,
          clientType,
        ),
      ];
      if (route.input) {
        params.push(
          ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            "args",
            undefined,
            inputRef,
          ),
        );
      }

      const toolNameExpr = ts.factory.createPropertyAccessExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier(route.name),
          "METADATA",
        ),
        "tool",
      );

      const callToolParams: ts.ObjectLiteralElementLike[] = [
        ts.factory.createPropertyAssignment("name", toolNameExpr),
      ];
      if (route.input) {
        callToolParams.push(
          ts.factory.createPropertyAssignment(
            "arguments",
            ts.factory.createAsExpression(
              ts.factory.createAsExpression(
                ts.factory.createIdentifier("args"),
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
              ),
              ts.factory.createTypeReferenceNode("Record", [
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
              ]),
            ),
          ),
        );
      }

      const body = ts.factory.createBlock(
        [
          // const raw = await client.callTool({ ... });
          // NOTE: callTool returns `CallToolResult | CompatibilityCallToolResult`
          //       (the pre-2024-11-05 compat variant has `toolResult`, no
          //       `content`). TypeScript cannot narrow the union structurally
          //       because both variants carry an `[x: string]: unknown` index
          //       signature. Branch at runtime, then cast to CallToolResult
          //       once for the modern path.
          ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  "raw",
                  undefined,
                  undefined,
                  ts.factory.createAwaitExpression(
                    ts.factory.createCallExpression(
                      ts.factory.createPropertyAccessExpression(
                        ts.factory.createIdentifier("client"),
                        "callTool",
                      ),
                      undefined,
                      [
                        ts.factory.createObjectLiteralExpression(
                          callToolParams,
                          true,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          ),
          // if ("toolResult" in raw) throw ...;
          ts.factory.createIfStatement(
            ts.factory.createBinaryExpression(
              ts.factory.createStringLiteral("toolResult"),
              ts.factory.createToken(ts.SyntaxKind.InKeyword),
              ts.factory.createIdentifier("raw"),
            ),
            ts.factory.createThrowStatement(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("Error"),
                undefined,
                [
                  ts.factory.createTemplateExpression(
                    ts.factory.createTemplateHead('MCP tool "'),
                    [
                      ts.factory.createTemplateSpan(
                        toolNameExpr,
                        ts.factory.createTemplateTail(
                          '" returned a legacy (pre-2024-11-05) compatibility result',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // const result: CallToolResult = raw;
          //   Safe: preceding branch rejected the compat variant.
          ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  "result",
                  undefined,
                  ts.factory.createTypeReferenceNode(callToolResultTypeName),
                  ts.factory.createAsExpression(
                    ts.factory.createIdentifier("raw"),
                    ts.factory.createTypeReferenceNode(callToolResultTypeName),
                  ),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          ),
          // if (result.isError === true) throw ...;
          ts.factory.createIfStatement(
            ts.factory.createBinaryExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("result"),
                "isError",
              ),
              ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
              ts.factory.createTrue(),
            ),
            ts.factory.createThrowStatement(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("Error"),
                undefined,
                [
                  ts.factory.createTemplateExpression(
                    ts.factory.createTemplateHead('MCP tool "'),
                    [
                      ts.factory.createTemplateSpan(
                        toolNameExpr,
                        ts.factory.createTemplateTail('" returned isError'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          // const first = result.content[0];
          ts.factory.createVariableStatement(
            undefined,
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  "first",
                  undefined,
                  undefined,
                  ts.factory.createElementAccessExpression(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("result"),
                      "content",
                    ),
                    ts.factory.createNumericLiteral(0),
                  ),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          ),
          ts.factory.createIfStatement(
            ts.factory.createBinaryExpression(
              ts.factory.createBinaryExpression(
                ts.factory.createIdentifier("first"),
                ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                ts.factory.createIdentifier("undefined"),
              ),
              ts.factory.createToken(ts.SyntaxKind.BarBarToken),
              ts.factory.createBinaryExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("first"),
                  "type",
                ),
                ts.factory.createToken(
                  ts.SyntaxKind.ExclamationEqualsEqualsToken,
                ),
                ts.factory.createStringLiteral("text"),
              ),
            ),
            ts.factory.createThrowStatement(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("Error"),
                undefined,
                [
                  ts.factory.createTemplateExpression(
                    ts.factory.createTemplateHead('MCP tool "'),
                    [
                      ts.factory.createTemplateSpan(
                        toolNameExpr,
                        ts.factory.createTemplateTail(
                          '" returned no text content',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          ts.factory.createReturnStatement(
            ts.factory.createAsExpression(
              ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("JSON"),
                  "parse",
                ),
                undefined,
                [
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("first"),
                    "text",
                  ),
                ],
              ),
              outputRef,
            ),
          ),
        ],
        true,
      );

      return ts.factory.createFunctionDeclaration(
        [
          ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
          ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        params,
        ts.factory.createTypeReferenceNode("Promise", [outputRef]),
        body,
      );
    };

  /* ---------------------------------------------------------
    NAMESPACE
  --------------------------------------------------------- */
  const writeNamespace =
    (_project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedMcpRoute): ts.ModuleDeclaration => {
      const statements: ts.Statement[] = [];

      // Input type alias
      if (route.input) {
        statements.push(
          ts.factory.createTypeAliasDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            "Input",
            undefined,
            ts.factory.createTypeReferenceNode(route.input.type.name),
          ),
        );
      }

      // Output type alias = Primitive<ReturnType>
      const primitiveName = importer.external({
        declaration: true,
        file: "typia",
        type: "element",
        name: "Primitive",
      });
      const outputInner: ts.TypeNode = route.returnType
        ? ts.factory.createTypeReferenceNode(
            unwrapPromise(route.returnType.name),
          )
        : ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
      statements.push(
        ts.factory.createTypeAliasDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          "Output",
          undefined,
          ts.factory.createTypeReferenceNode(primitiveName, [outputInner]),
        ),
      );

      // METADATA const
      const metadataProps: ts.ObjectLiteralElementLike[] = [
        ts.factory.createPropertyAssignment(
          "protocol",
          ts.factory.createStringLiteral("mcp"),
        ),
        ts.factory.createPropertyAssignment(
          "tool",
          ts.factory.createStringLiteral(route.toolName),
        ),
        ts.factory.createPropertyAssignment(
          "title",
          route.title === null
            ? ts.factory.createNull()
            : ts.factory.createStringLiteral(route.title),
        ),
        ts.factory.createPropertyAssignment(
          "description",
          route.toolDescription === null
            ? ts.factory.createNull()
            : ts.factory.createStringLiteral(route.toolDescription),
        ),
      ];
      statements.push(
        ts.factory.createVariableStatement(
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                "METADATA",
                undefined,
                undefined,
                ts.factory.createAsExpression(
                  ts.factory.createObjectLiteralExpression(metadataProps, true),
                  ts.factory.createTypeReferenceNode("const"),
                ),
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
      );

      return ts.factory.createModuleDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(route.name),
        ts.factory.createModuleBlock(statements),
        ts.NodeFlags.Namespace,
      );
    };

  /* ---------------------------------------------------------
    DESCRIPTION
  --------------------------------------------------------- */
  const writeDescription = (route: ITypedMcpRoute): string => {
    const lines: string[] = [];
    if (route.toolDescription) lines.push(...route.toolDescription.split("\n"));
    else if (route.description) lines.push(...route.description.split("\n"));
    if (lines.length) lines.push("");
    lines.push(
      `@controller ${route.controller.class.name}.${route.name}`,
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
}
