import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { StringUtil } from "../../utils/StringUtil";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkHttpFunctionProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.FunctionDeclaration => {
      return ts.factory.createFunctionDeclaration(
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
              route.headerObject !== null
                ? [ts.factory.createTypeReferenceNode(`${route.name}.Headers`)]
                : undefined,
            ),
          ),
          ...SdkHttpParameterProgrammer.getParameterDeclarations({
            project,
            importer,
            route,
            body: true,
            prefix: true,
          }),
        ],
        ts.factory.createTypeReferenceNode("Promise", [
          project.config.propagate === true ||
          route.success.metadata.size() !== 0
            ? ts.factory.createTypeReferenceNode(`${route.name}.Output`)
            : ts.factory.createTypeReferenceNode("void"),
        ]),
        ts.factory.createBlock(writeBody(project)(importer)(route), true),
      );
    };

  const writeBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.Statement[] => {
      const access = (name: string): ts.Expression =>
        project.config.keyword === true
          ? IdentifierFactory.access(ts.factory.createIdentifier("props"), name)
          : ts.factory.createIdentifier(name);
      const fetch = () =>
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              SdkImportWizard.Fetcher(
                !!route.body?.encrypted || route.success.encrypted,
              )(importer),
            ),
            project.config.propagate ? "propagate" : "fetch",
          ),
          project.config.propagate
            ? route.method.toLowerCase() === "get" ||
              route.method.toLowerCase() === "head"
              ? [TypeFactory.keyword("any")]
              : [TypeFactory.keyword("any"), TypeFactory.keyword("any")]
            : undefined,
          [
            route.body && route.body.contentType !== "multipart/form-data"
              ? ts.factory.createObjectLiteralExpression(
                  [
                    ts.factory.createSpreadAssignment(
                      ts.factory.createIdentifier("connection"),
                    ),
                    ts.factory.createPropertyAssignment(
                      "headers",
                      ts.factory.createObjectLiteralExpression(
                        [
                          ts.factory.createSpreadAssignment(
                            IdentifierFactory.access(
                              ts.factory.createIdentifier("connection"),
                              "headers",
                            ),
                          ),
                          ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral("Content-Type"),
                            ts.factory.createStringLiteral(
                              route.body?.contentType ?? "application/json",
                            ),
                          ),
                        ],
                        true,
                      ),
                    ),
                  ],
                  true,
                )
              : ts.factory.createIdentifier("connection"),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createSpreadAssignment(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(route.name),
                    "METADATA",
                  ),
                ),
                ts.factory.createPropertyAssignment(
                  "template",
                  IdentifierFactory.access(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(route.name),
                      "METADATA",
                    ),
                    "path",
                  ),
                ),
                ts.factory.createPropertyAssignment(
                  "path",
                  ts.factory.createCallExpression(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(route.name),
                      "path",
                    ),
                    undefined,
                    SdkHttpParameterProgrammer.getArguments({
                      project,
                      route,
                      body: false,
                    }),
                  ),
                ),
              ],
              true,
            ),
            ...(route.body ? [access(route.body.name)] : []),
            ...(project.config.json &&
            route.body !== null &&
            (route.body.contentType === "application/json" ||
              route.body.encrypted === true)
              ? [ts.factory.createIdentifier(`${route.name}.stringify`)]
              : []),
          ],
        );
      const output = (awaiter: boolean) =>
        project.config.simulate
          ? ts.factory.createConditionalExpression(
              ts.factory.createIdentifier("!!connection.simulate"),
              undefined,
              ts.factory.createCallExpression(
                ts.factory.createIdentifier(`${route.name}.simulate`),
                [],
                [
                  ts.factory.createIdentifier("connection"),
                  ...SdkHttpParameterProgrammer.getArguments({
                    project,
                    route,
                    body: true,
                  }),
                ],
              ),
              undefined,
              awaiter ? ts.factory.createAwaitExpression(fetch()) : fetch(),
            )
          : awaiter
            ? ts.factory.createAwaitExpression(fetch())
            : fetch();
      return [
        ...(project.config.assert
          ? SdkHttpParameterProgrammer.getSignificant(route, true).map((p) =>
              ts.factory.createExpressionStatement(
                ts.factory.createCallExpression(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(
                      SdkImportWizard.typia(importer),
                    ),
                    "assert",
                  ),
                  [
                    ts.factory.createTypeQueryNode(
                      ts.factory.createIdentifier(p.name),
                    ),
                  ],
                  [ts.factory.createIdentifier(p.name)],
                ),
              ),
            )
          : []),
        ...(route.success.setHeaders.length === 0
          ? [ts.factory.createReturnStatement(output(false))]
          : writeSetHeaders(project)(importer)(route)(output(true))),
      ];
    };

  const writeSetHeaders =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) =>
    (condition: ts.Expression): ts.Statement[] => {
      const accessor = (x: string) => (y: string) =>
        x[0] === "[" ? `${x}${y}` : `${x}.${y}`;
      const output: string = StringUtil.escapeDuplicate([
        "connection",
        ...SdkHttpParameterProgrammer.getSignificant(route, true).map(
          (p) => p.name,
        ),
      ])("output");
      const headers: string = accessor("connection")("headers");
      const data: string = project.config.propagate
        ? accessor(output)("data")
        : output;

      const assigners: ts.ExpressionStatement[] = [
        ts.factory.createBinaryExpression(
          ts.factory.createIdentifier(headers),
          ts.factory.createToken(ts.SyntaxKind.QuestionQuestionEqualsToken),
          ts.factory.createObjectLiteralExpression([]),
        ),
        ...route.success.setHeaders.map((tuple) =>
          tuple.type === "assigner"
            ? ts.factory.createCallExpression(
                ts.factory.createIdentifier("Object.assign"),
                [],
                [
                  ts.factory.createIdentifier(headers),
                  ts.factory.createIdentifier(accessor(data)(tuple.source)),
                ],
              )
            : ts.factory.createBinaryExpression(
                ts.factory.createIdentifier(
                  accessor(headers)(tuple.target ?? tuple.source),
                ),
                ts.factory.createToken(ts.SyntaxKind.EqualsToken),
                ts.factory.createIdentifier(accessor(data)(tuple.source)),
              ),
        ),
      ].map(ts.factory.createExpressionStatement);
      return [
        ts.factory.createVariableStatement(
          [],
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                output,
                undefined,
                SdkAliasCollection.response(project)(importer)(route),
                condition,
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        ...(project.config.propagate
          ? [
              ts.factory.createIfStatement(
                ts.factory.createIdentifier(accessor(output)("success")),
                assigners.length === 1
                  ? assigners[0]
                  : ts.factory.createBlock(assigners, true),
                undefined,
              ),
            ]
          : assigners),
        ts.factory.createReturnStatement(ts.factory.createIdentifier(output)),
      ];
    };
}
