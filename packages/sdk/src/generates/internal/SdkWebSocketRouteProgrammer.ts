import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { ImportDictionary } from "./ImportDictionary";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";
import { SdkWebSocketNamespaceProgrammer } from "./SdkWebSocketNamespaceProgrammer";

export namespace SdkWebSocketRouteProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.Statement[] => [
      writeFunction(project)(importer)(route),
      SdkWebSocketNamespaceProgrammer.write(project)(importer)(route),
    ];

  const writeFunction =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.FunctionDeclaration =>
      ts.factory.createFunctionDeclaration(
        [
          ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
          ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            ts.factory.createTypeReferenceNode(
              SdkImportWizard.IConnection(importer),
              [ts.factory.createTypeReferenceNode(`${route.name}.Header`)],
            ),
          ),
          ...route.parameters
            .filter((p) => p.category === "param" || p.category === "query")
            .map((p) =>
              IdentifierFactory.parameter(
                p.name,
                p.category === "param"
                  ? getPathParameterType(project)(importer)(p)
                  : ts.factory.createTypeReferenceNode(`${route.name}.Query`),
              ),
            ),
          IdentifierFactory.parameter(
            "provider",
            ts.factory.createTypeReferenceNode(`${route.name}.Provider`),
          ),
        ],
        ts.factory.createTypeReferenceNode("Promise", [
          ts.factory.createTypeReferenceNode(`${route.name}.Output`),
        ]),
        ts.factory.createBlock(writeFunctionBody(importer)(route), true),
      );

  const writeFunctionBody =
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.Statement[] => [
      local("connector")(
        ts.factory.createTypeReferenceNode(
          importer.external({
            type: false,
            library: "tgrid",
            instance: "WebConnector",
          }),
          [
            ts.factory.createTypeReferenceNode(`${route.name}.Header`),
            ts.factory.createTypeReferenceNode(`${route.name}.Provider`),
            ts.factory.createTypeReferenceNode(`${route.name}.Listener`),
          ],
        ),
      )(
        ts.factory.createNewExpression(
          ts.factory.createIdentifier(
            importer.external({
              type: false,
              library: "tgrid",
              instance: "WebConnector",
            }),
          ),
          undefined,
          [
            ts.factory.createAsExpression(
              ts.factory.createBinaryExpression(
                ts.factory.createPropertyAccessExpression(
                  ts.factory.createIdentifier("connection"),
                  "headers",
                ),
                ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                ts.factory.createObjectLiteralExpression([], false),
              ),
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            ),
            ts.factory.createIdentifier("provider"),
          ],
        ),
      ),
      ts.factory.createExpressionStatement(
        ts.factory.createAwaitExpression(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("connector"),
              "connect",
            ),
            undefined,
            [
              joinPath(
                ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier(route.name),
                    "path",
                  ),
                  [],
                  route.parameters
                    .filter(
                      (p) => p.category === "param" || p.category === "query",
                    )
                    .map((x) => ts.factory.createIdentifier(x.name)),
                ),
              ),
            ],
          ),
        ),
      ),
      local("driver")(
        ts.factory.createTypeReferenceNode(
          ts.factory.createIdentifier(
            importer.external({
              type: true,
              library: "tgrid",
              instance: "Driver",
            }),
          ),
          [ts.factory.createTypeReferenceNode(`${route.name}.Listener`)],
        ),
      )(
        ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier("connector"),
            "getDriver",
          ),
          undefined,
          undefined,
        ),
      ),
      ts.factory.createReturnStatement(
        ts.factory.createObjectLiteralExpression(
          [
            ts.factory.createShorthandPropertyAssignment("connector"),
            ts.factory.createShorthandPropertyAssignment("driver"),
          ],
          true,
        ),
      ),
    ];
}

const local =
  (name: string) => (type: ts.TypeNode) => (expression: ts.Expression) =>
    ts.factory.createVariableStatement(
      [],
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            name,
            undefined,
            type,
            expression,
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );

const joinPath = (caller: ts.Expression) =>
  ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createTemplateExpression(
                ts.factory.createTemplateHead("", ""),
                [
                  ts.factory.createTemplateSpan(
                    ts.factory.createPropertyAccessExpression(
                      ts.factory.createIdentifier("connection"),
                      ts.factory.createIdentifier("host"),
                    ),
                    ts.factory.createTemplateMiddle("/", "/"),
                  ),
                  ts.factory.createTemplateSpan(
                    caller,
                    ts.factory.createTemplateTail("", ""),
                  ),
                ],
              ),
              ts.factory.createIdentifier("split"),
            ),
            undefined,
            [ts.factory.createStringLiteral("/")],
          ),
          ts.factory.createIdentifier("filter"),
        ),
        undefined,
        [
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                ts.factory.createIdentifier("str"),
                undefined,
                undefined,
                undefined,
              ),
            ],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createPrefixUnaryExpression(
              ts.SyntaxKind.ExclamationToken,
              ts.factory.createPrefixUnaryExpression(
                ts.SyntaxKind.ExclamationToken,
                ts.factory.createIdentifier("str"),
              ),
            ),
          ),
        ],
      ),
      ts.factory.createIdentifier("join"),
    ),
    undefined,
    [ts.factory.createStringLiteral("/")],
  );
const getPathParameterType =
  (project: INestiaProject) =>
  (importer: ImportDictionary) =>
  (p: ITypedWebSocketRoute.IPathParameter) =>
    p.metadata
      ? SdkTypeProgrammer.write(project)(importer)(p.metadata)
      : ts.factory.createTypeReferenceNode(p.typeName);
