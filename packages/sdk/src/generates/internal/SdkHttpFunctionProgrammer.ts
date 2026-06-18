import {
  type EntityName,
  type Expression,
  type Node,
  NodeFlags,
  type ParameterDeclaration,
  type Statement,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { TypeFactory } from "../../factories/TypeFactory";
import { sizeOf } from "../../internal/legacy";
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
    (route: ITypedHttpRoute): Node => {
      return factory.createFunctionDeclaration(
        [
          factory.createModifier(SyntaxKind.ExportKeyword),
          factory.createModifier(SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            factory.createTypeReferenceNode(
              SdkImportWizard.IConnection(importer),
              route.headerObject !== null
                ? [factory.createTypeReferenceNode(`${route.name}.Headers`)]
                : undefined,
            ),
          ),
          ...(SdkHttpParameterProgrammer.getParameterDeclarations({
            project,
            importer,
            route,
            body: true,
            prefix: true,
          }) as ParameterDeclaration[]),
        ],
        factory.createTypeReferenceNode("Promise", [
          project.config.propagate === true ||
          route.success.binary === true ||
          sizeOf(route.success.metadata) !== 0
            ? factory.createTypeReferenceNode(`${route.name}.Output`)
            : factory.createTypeReferenceNode("void"),
        ]),
        factory.createBlock(writeBody(project)(importer)(route), true),
      );
    };

  const writeBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Statement[] => {
      const access = (name: string): Expression =>
        project.config.keyword === true
          ? factory.createPropertyAccessExpression(
              factory.createIdentifier("props"),
              name,
            )
          : factory.createIdentifier(name);
      const fetch = () =>
        factory.createCallExpression(
          IdentifierFactory.access(
            factory.createIdentifier(
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
              ? factory.createObjectLiteralExpression(
                  [
                    factory.createSpreadAssignment(
                      factory.createIdentifier("connection"),
                    ),
                    factory.createPropertyAssignment(
                      "headers",
                      factory.createObjectLiteralExpression(
                        [
                          factory.createSpreadAssignment(
                            IdentifierFactory.access(
                              factory.createIdentifier("connection"),
                              "headers",
                            ),
                          ),
                          factory.createPropertyAssignment(
                            factory.createStringLiteral("Content-Type"),
                            factory.createStringLiteral(
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
              : factory.createIdentifier("connection"),
            factory.createObjectLiteralExpression(
              [
                factory.createSpreadAssignment(
                  IdentifierFactory.access(
                    factory.createIdentifier(route.name),
                    "METADATA",
                  ),
                ),
                factory.createPropertyAssignment(
                  "template",
                  IdentifierFactory.access(
                    IdentifierFactory.access(
                      factory.createIdentifier(route.name),
                      "METADATA",
                    ),
                    "path",
                  ),
                ),
                factory.createPropertyAssignment(
                  "path",
                  factory.createCallExpression(
                    IdentifierFactory.access(
                      factory.createIdentifier(route.name),
                      "path",
                    ),
                    undefined,
                    SdkHttpParameterProgrammer.getArguments({
                      project,
                      route,
                      body: false,
                    }) as Expression[],
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
              ? [factory.createIdentifier(`${route.name}.stringify`)]
              : []),
          ],
        );
      const output = (awaiter: boolean) =>
        project.config.simulate
          ? factory.createConditionalExpression(
              factory.createStrictEquality(
                factory.createTrue(),
                factory.createIdentifier("connection.simulate"),
              ),
              undefined,
              factory.createCallExpression(
                factory.createIdentifier(`${route.name}.simulate`),
                [],
                [
                  factory.createIdentifier("connection"),
                  ...(SdkHttpParameterProgrammer.getArguments({
                    project,
                    route,
                    body: true,
                  }) as Expression[]),
                ],
              ),
              undefined,
              awaiter ? factory.createAwaitExpression(fetch()) : fetch(),
            )
          : awaiter
            ? factory.createAwaitExpression(fetch())
            : fetch();
      return [
        ...(project.config.assert
          ? SdkHttpParameterProgrammer.getSignificant(route, true).map((p) =>
              factory.createExpressionStatement(
                factory.createCallExpression(
                  IdentifierFactory.access(
                    factory.createIdentifier(SdkImportWizard.typia(importer)),
                    "assert",
                  ),
                  [factory.createTypeQueryNode(access(p.name) as EntityName)],
                  [access(p.name)],
                ),
              ),
            )
          : []),
        ...(route.success.setHeaders.length === 0
          ? [factory.createReturnStatement(output(false))]
          : writeSetHeaders(project)(importer)(route)(output(true))),
      ];
    };

  const writeSetHeaders =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) =>
    (condition: Expression): Statement[] => {
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

      const assigners: Statement[] = [
        factory.createBinaryExpression(
          factory.createIdentifier(headers),
          factory.createToken(SyntaxKind.QuestionQuestionEqualsToken),
          factory.createObjectLiteralExpression([]),
        ),
        ...route.success.setHeaders.map((tuple) =>
          tuple.type === "assigner"
            ? factory.createCallExpression(
                factory.createIdentifier("Object.assign"),
                [],
                [
                  factory.createIdentifier(headers),
                  factory.createIdentifier(accessor(data)(tuple.source)),
                ],
              )
            : factory.createBinaryExpression(
                factory.createIdentifier(
                  accessor(headers)(tuple.target ?? tuple.source),
                ),
                factory.createToken(SyntaxKind.EqualsToken),
                factory.createIdentifier(accessor(data)(tuple.source)),
              ),
        ),
      ].map(factory.createExpressionStatement);
      return [
        factory.createVariableStatement(
          [],
          factory.createVariableDeclarationList(
            [
              factory.createVariableDeclaration(
                output,
                undefined,
                SdkAliasCollection.response(project)(importer)(
                  route,
                ) as TypeNode,
                condition,
              ),
            ],
            NodeFlags.Const,
          ),
        ),
        ...(project.config.propagate
          ? [
              factory.createIfStatement(
                factory.createIdentifier(accessor(output)("success")),
                assigners.length === 1
                  ? assigners[0]!
                  : factory.createBlock(assigners, true),
                undefined,
              ),
            ]
          : assigners),
        factory.createReturnStatement(factory.createIdentifier(output)),
      ];
    };
}
