import { TypeScriptFactory } from "@nestia/factory";
import { IdentifierFactory, TypeFactory } from "@typia/core";
import ts from "typescript";

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
      return TypeScriptFactory.createFunctionDeclaration(
        [
          TypeScriptFactory.createModifier(ts.SyntaxKind.ExportKeyword),
          TypeScriptFactory.createModifier(ts.SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            TypeScriptFactory.createTypeReferenceNode(
              SdkImportWizard.IConnection(importer),
              route.headerObject !== null
                ? [
                    TypeScriptFactory.createTypeReferenceNode(
                      `${route.name}.Headers`,
                    ),
                  ]
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
        TypeScriptFactory.createTypeReferenceNode("Promise", [
          project.config.propagate === true ||
          route.success.metadata.size() !== 0
            ? TypeScriptFactory.createTypeReferenceNode(`${route.name}.Output`)
            : TypeScriptFactory.createTypeReferenceNode("void"),
        ]),
        TypeScriptFactory.createBlock(
          writeBody(project)(importer)(route),
          true,
        ),
      );
    };

  const writeBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.Statement[] => {
      const access = (name: string): ts.Expression =>
        project.config.keyword === true
          ? IdentifierFactory.access(
              TypeScriptFactory.createIdentifier("props"),
              name,
            )
          : TypeScriptFactory.createIdentifier(name);
      const fetch = () =>
        TypeScriptFactory.createCallExpression(
          IdentifierFactory.access(
            TypeScriptFactory.createIdentifier(
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
              ? TypeScriptFactory.createObjectLiteralExpression(
                  [
                    TypeScriptFactory.createSpreadAssignment(
                      TypeScriptFactory.createIdentifier("connection"),
                    ),
                    TypeScriptFactory.createPropertyAssignment(
                      "headers",
                      TypeScriptFactory.createObjectLiteralExpression(
                        [
                          TypeScriptFactory.createSpreadAssignment(
                            IdentifierFactory.access(
                              TypeScriptFactory.createIdentifier("connection"),
                              "headers",
                            ),
                          ),
                          TypeScriptFactory.createPropertyAssignment(
                            TypeScriptFactory.createStringLiteral(
                              "Content-Type",
                            ),
                            TypeScriptFactory.createStringLiteral(
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
              : TypeScriptFactory.createIdentifier("connection"),
            TypeScriptFactory.createObjectLiteralExpression(
              [
                TypeScriptFactory.createSpreadAssignment(
                  IdentifierFactory.access(
                    TypeScriptFactory.createIdentifier(route.name),
                    "METADATA",
                  ),
                ),
                TypeScriptFactory.createPropertyAssignment(
                  "template",
                  IdentifierFactory.access(
                    IdentifierFactory.access(
                      TypeScriptFactory.createIdentifier(route.name),
                      "METADATA",
                    ),
                    "path",
                  ),
                ),
                TypeScriptFactory.createPropertyAssignment(
                  "path",
                  TypeScriptFactory.createCallExpression(
                    IdentifierFactory.access(
                      TypeScriptFactory.createIdentifier(route.name),
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
              ? [TypeScriptFactory.createIdentifier(`${route.name}.stringify`)]
              : []),
          ],
        );
      const output = (awaiter: boolean) =>
        project.config.simulate
          ? TypeScriptFactory.createConditionalExpression(
              TypeScriptFactory.createStrictEquality(
                TypeScriptFactory.createTrue(),
                TypeScriptFactory.createIdentifier("connection.simulate"),
              ),
              undefined,
              TypeScriptFactory.createCallExpression(
                TypeScriptFactory.createIdentifier(`${route.name}.simulate`),
                [],
                [
                  TypeScriptFactory.createIdentifier("connection"),
                  ...SdkHttpParameterProgrammer.getArguments({
                    project,
                    route,
                    body: true,
                  }),
                ],
              ),
              undefined,
              awaiter
                ? TypeScriptFactory.createAwaitExpression(fetch())
                : fetch(),
            )
          : awaiter
            ? TypeScriptFactory.createAwaitExpression(fetch())
            : fetch();
      return [
        ...(project.config.assert
          ? SdkHttpParameterProgrammer.getSignificant(route, true).map((p) =>
              TypeScriptFactory.createExpressionStatement(
                TypeScriptFactory.createCallExpression(
                  IdentifierFactory.access(
                    TypeScriptFactory.createIdentifier(
                      SdkImportWizard.typia(importer),
                    ),
                    "assert",
                  ),
                  [
                    TypeScriptFactory.createTypeQueryNode(
                      TypeScriptFactory.createIdentifier(p.name),
                    ),
                  ],
                  [TypeScriptFactory.createIdentifier(p.name)],
                ),
              ),
            )
          : []),
        ...(route.success.setHeaders.length === 0
          ? [TypeScriptFactory.createReturnStatement(output(false))]
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
        TypeScriptFactory.createBinaryExpression(
          TypeScriptFactory.createIdentifier(headers),
          TypeScriptFactory.createToken(
            ts.SyntaxKind.QuestionQuestionEqualsToken,
          ),
          TypeScriptFactory.createObjectLiteralExpression([]),
        ),
        ...route.success.setHeaders.map((tuple) =>
          tuple.type === "assigner"
            ? TypeScriptFactory.createCallExpression(
                TypeScriptFactory.createIdentifier("Object.assign"),
                [],
                [
                  TypeScriptFactory.createIdentifier(headers),
                  TypeScriptFactory.createIdentifier(
                    accessor(data)(tuple.source),
                  ),
                ],
              )
            : TypeScriptFactory.createBinaryExpression(
                TypeScriptFactory.createIdentifier(
                  accessor(headers)(tuple.target ?? tuple.source),
                ),
                TypeScriptFactory.createToken(ts.SyntaxKind.EqualsToken),
                TypeScriptFactory.createIdentifier(
                  accessor(data)(tuple.source),
                ),
              ),
        ),
      ].map(TypeScriptFactory.createExpressionStatement);
      return [
        TypeScriptFactory.createVariableStatement(
          [],
          TypeScriptFactory.createVariableDeclarationList(
            [
              TypeScriptFactory.createVariableDeclaration(
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
              TypeScriptFactory.createIfStatement(
                TypeScriptFactory.createIdentifier(accessor(output)("success")),
                assigners.length === 1
                  ? assigners[0]!
                  : TypeScriptFactory.createBlock(assigners, true),
                undefined,
              ),
            ]
          : assigners),
        TypeScriptFactory.createReturnStatement(
          TypeScriptFactory.createIdentifier(output),
        ),
      ];
    };
}
