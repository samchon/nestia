import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { StringUtil } from "../../utils/StringUtil";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkHttpFunctionProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRouteParameter.IHeaders | undefined;
        query: ITypedHttpRouteParameter.IQuery | undefined;
        body: ITypedHttpRouteParameter.IBody | undefined;
      },
    ): ts.FunctionDeclaration =>
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
              props.headers
                ? [ts.factory.createTypeReferenceNode(`${route.name}.Headers`)]
                : undefined,
            ),
          ),
          ...(project.config.keyword === true &&
          route.parameters.filter((p) => p.category !== "headers").length !== 0
            ? [
                ts.factory.createParameterDeclaration(
                  [],
                  undefined,
                  "props",
                  undefined,
                  ts.factory.createTypeReferenceNode(`${route.name}.IProps`),
                ),
              ]
            : route.parameters
                .filter((p) => p.category !== "headers")
                .map((p) =>
                  ts.factory.createParameterDeclaration(
                    [],
                    undefined,
                    p.name,
                    p.metadata.optional === true
                      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                      : undefined,
                    project.config.primitive !== false &&
                      (p === props.query || p === props.body)
                      ? ts.factory.createTypeReferenceNode(
                          `${route.name}.${p === props.query ? "Query" : "RequestBody"}`,
                        )
                      : project.config.clone === true
                        ? SdkAliasCollection.from(project)(importer)(p.metadata)
                        : SdkAliasCollection.name(p),
                  ),
                )),
        ],
        ts.factory.createTypeReferenceNode("Promise", [
          project.config.propagate === true ||
          route.success.metadata.size() !== 0
            ? ts.factory.createTypeReferenceNode(`${route.name}.Response`)
            : ts.factory.createTypeReferenceNode("void"),
        ]),
        ts.factory.createBlock(
          writeBody(project)(importer)(route, props),
          true,
        ),
      );

  const writeBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRouteParameter.IHeaders | undefined;
        query: ITypedHttpRouteParameter.IQuery | undefined;
        body: ITypedHttpRouteParameter.IBody | undefined;
      },
    ): ts.Statement[] => {
      const property = (name: string): ts.Expression =>
        project.config.keyword === true
          ? IdentifierFactory.access(ts.factory.createIdentifier("props"), name)
          : ts.factory.createIdentifier(name);
      const fetch = () =>
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              SdkImportWizard.Fetcher(
                !!props.body?.encrypted || route.success.encrypted,
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
            props.body && props.body.contentType !== "multipart/form-data"
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
                              props.body?.contentType ?? "application/json",
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
                    getArguments(project, route, false),
                  ),
                ),
              ],
              true,
            ),
            ...(props.body ? [property(props.body.name)] : []),
            ...(project.config.json &&
            props.body !== undefined &&
            (props.body.contentType === "application/json" ||
              props.body.encrypted === true)
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
                  ...getArguments(project, route, true),
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
          ? route.parameters
              .filter((p) => p.category !== "headers")
              .map((p) =>
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
        ...route.parameters.map((p) => p.name),
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

  const getArguments = (
    project: INestiaProject,
    route: ITypedHttpRoute,
    body: boolean,
  ): ts.Expression[] => {
    const parameters = route.parameters.filter(
      (p) =>
        p.category === "param" ||
        p.category === "query" ||
        (body === true && p.category === "body"),
    );
    if (parameters.length === 0) return [];
    else if (project.config.keyword === true)
      return [ts.factory.createIdentifier("props")];
    return parameters.map((p) => ts.factory.createIdentifier(p.name));
  };
}
