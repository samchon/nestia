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
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkHttpFunctionProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Node => {
      const names: SdkHttpParameterProgrammer.INames =
        SdkHttpParameterProgrammer.getNames({ project, route });
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
            names.connection,
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
        factory.createBlock(writeBody(project)(importer)(route)(names), true),
      );
    };

  const writeBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) =>
    (names: SdkHttpParameterProgrammer.INames): Statement[] => {
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
                      factory.createIdentifier(names.connection),
                    ),
                    factory.createPropertyAssignment(
                      "headers",
                      factory.createObjectLiteralExpression(
                        [
                          factory.createSpreadAssignment(
                            IdentifierFactory.access(
                              factory.createIdentifier(names.connection),
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
              : factory.createIdentifier(names.connection),
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
            ...(route.body ? [names.access(route.body)] : []),
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
                IdentifierFactory.access(
                  factory.createIdentifier(names.connection),
                  "simulate",
                ),
              ),
              undefined,
              factory.createCallExpression(
                factory.createIdentifier(`${route.name}.simulate`),
                [],
                [
                  factory.createIdentifier(names.connection),
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
                  [factory.createTypeQueryNode(names.access(p) as EntityName)],
                  [names.access(p)],
                ),
              ),
            )
          : []),
        ...(route.success.setHeaders.length === 0
          ? [factory.createReturnStatement(output(false))]
          : writeSetHeaders(project)(importer)(route)(names)(output(true))),
      ];
    };

  const writeSetHeaders =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) =>
    (names: SdkHttpParameterProgrammer.INames) =>
    (condition: Expression): Statement[] => {
      const accessor = (x: string) => (y: string) =>
        x[0] === "[" ? `${x}${y}` : `${x}.${y}`;
      const output: string = names.output;
      const headers: string = accessor(names.connection)("headers");
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
                // a target is a header name, which usually is no identifier
                tuple.target !== undefined
                  ? IdentifierFactory.access(
                      factory.createIdentifier(headers),
                      tuple.target,
                    )
                  : factory.createIdentifier(accessor(headers)(tuple.source)),
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
