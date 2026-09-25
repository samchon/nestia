import {
  type Expression,
  type ExpressionStatement,
  type Node,
  NodeFlags,
  type ParameterDeclaration,
  type Statement,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { ExpressionFactory } from "../../factories/ExpressionFactory";
import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { LiteralFactory } from "../../factories/LiteralFactory";
import { StatementFactory } from "../../factories/StatementFactory";
import { TypeFactory } from "../../factories/TypeFactory";
import { sizeOf } from "../../internal/legacy";
import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace SdkHttpSimulationProgrammer {
  export const random =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Node => {
      const output: TypeNode = SdkAliasCollection.responseBody(project)(
        importer,
      )(route) as TypeNode;
      return constant("random")(
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          project.config.primitive === false || route.success.binary === true
            ? output
            : factory.createTypeReferenceNode(
                SdkImportWizard.Resolved(importer),
                [output],
              ),
          undefined,
          route.success.binary === true
            ? factory.createNewExpression(
                factory.createIdentifier("ReadableStream"),
                [SdkAliasCollection.binaryChunk() as TypeNode],
                [],
              )
            : factory.createCallExpression(
                IdentifierFactory.access(
                  factory.createIdentifier(SdkImportWizard.typia(importer)),
                  "random",
                ),
                [output],
                undefined,
              ),
        ),
      );
    };

  export const simulate =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Node => {
      const names: SdkHttpParameterProgrammer.INames =
        SdkHttpParameterProgrammer.getNames({ project, route });
      const output: boolean =
        project.config.propagate === true ||
        route.success.binary === true ||
        sizeOf(route.success.metadata) !== 0;
      const caller = () =>
        factory.createCallExpression(
          factory.createIdentifier("random"),
          undefined,
          undefined,
        );
      return constant("simulate")(
        factory.createArrowFunction(
          undefined,
          undefined,
          [
            IdentifierFactory.parameter(
              SdkHttpParameterProgrammer.getSignificant(route, true).length !==
                0 || route.headerObject !== null
                ? names.connection
                : `_${names.connection}`,
              factory.createTypeReferenceNode(
                SdkImportWizard.IConnection(importer),
                route.headerObject
                  ? [factory.createTypeReferenceNode(`${route.name}.Headers`)]
                  : [],
              ),
            ),
            ...(SdkHttpParameterProgrammer.getParameterDeclarations({
              project,
              importer,
              route,
              body: true,
              prefix: false,
            }) as ParameterDeclaration[]),
          ],
          factory.createTypeReferenceNode(output ? "Output" : "void"),
          undefined,
          factory.createBlock(
            [
              ...assert(project)(importer)(route)(names),
              factory.createReturnStatement(
                project.config.propagate
                  ? factory.createAsExpression(
                      factory.createObjectLiteralExpression(
                        [
                          factory.createPropertyAssignment(
                            "success",
                            factory.createTrue(),
                          ),
                          factory.createPropertyAssignment(
                            "status",
                            ExpressionFactory.number(
                              route.success.status ??
                                (route.method === "POST" ? 201 : 200),
                            ),
                          ),
                          factory.createPropertyAssignment(
                            "headers",
                            LiteralFactory.write({
                              "Content-Type": route.success.contentType,
                            }),
                          ),
                          factory.createPropertyAssignment("data", caller()),
                        ],
                        true,
                      ),
                      factory.createTypeReferenceNode("Output"),
                    )
                  : caller(),
              ),
            ],
            true,
          ),
        ),
      );
    };

  const assert =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) =>
    (names: SdkHttpParameterProgrammer.INames): Statement[] => {
      const parameters = SdkHttpParameterProgrammer.getSignificant(route, true);
      if (parameters.length === 0 && route.headerObject === null) return [];

      const typia = SdkImportWizard.typia(importer);
      const validator = StatementFactory.constant({
        name: names.assert,
        value: factory.createCallExpression(
          IdentifierFactory.access(
            factory.createIdentifier(
              importer.external({
                file: `@nestia/fetcher`,
                declaration: false,
                type: "element",
                name: "NestiaSimulator",
              }),
            ),
            "assert",
          ),
          undefined,
          [
            factory.createObjectLiteralExpression(
              [
                factory.createPropertyAssignment(
                  "method",
                  factory.createIdentifier("METADATA.method"),
                ),
                factory.createPropertyAssignment(
                  "host",
                  IdentifierFactory.access(
                    factory.createIdentifier(names.connection),
                    "host",
                  ),
                ),
                factory.createPropertyAssignment(
                  "path",
                  factory.createCallExpression(
                    factory.createIdentifier("path"),
                    undefined,
                    SdkHttpParameterProgrammer.getArguments({
                      project,
                      route,
                      body: false,
                    }) as Expression[],
                  ),
                ),
                factory.createPropertyAssignment(
                  "contentType",
                  factory.createIdentifier(
                    JSON.stringify(route.success.contentType),
                  ),
                ),
              ],
              true,
            ),
          ],
        ),
      });
      const individual: ExpressionStatement[] = parameters
        .map((p) =>
          factory.createCallExpression(
            (() => {
              const base = IdentifierFactory.access(
                factory.createIdentifier(names.assert),
                p.category,
              );
              if (p.category !== "param") return base;
              return factory.createCallExpression(base, undefined, [
                factory.createStringLiteral(p.name),
              ]);
            })(),
            undefined,
            [
              factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                factory.createCallExpression(
                  IdentifierFactory.access(
                    factory.createIdentifier(typia),
                    "assert",
                  ),
                  undefined,
                  [names.access(p)],
                ),
              ),
            ],
          ),
        )
        .map(factory.createExpressionStatement);
      // the headers travel in the connection, validated as the server does
      if (route.headerObject !== null)
        individual.push(
          factory.createExpressionStatement(
            factory.createCallExpression(
              IdentifierFactory.access(
                factory.createIdentifier(names.assert),
                "headers",
              ),
              undefined,
              [
                factory.createArrowFunction(
                  undefined,
                  undefined,
                  [],
                  undefined,
                  undefined,
                  factory.createCallExpression(
                    IdentifierFactory.access(
                      factory.createIdentifier(typia),
                      "assert",
                    ),
                    [factory.createTypeReferenceNode(`${route.name}.Headers`)],
                    [
                      IdentifierFactory.access(
                        factory.createIdentifier(names.connection),
                        "headers",
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      return [
        validator,
        ...(project.config.propagate !== true
          ? individual
          : [tryAndCatch(importer)(individual)]),
      ];
    };

  const tryAndCatch =
    (importer: ImportDictionary) => (individual: Statement[]) =>
      factory.createTryStatement(
        factory.createBlock(individual, true),
        factory.createCatchClause(
          "exp",
          factory.createBlock(
            [
              factory.createIfStatement(
                factory.createLogicalNot(
                  factory.createCallExpression(
                    IdentifierFactory.access(
                      factory.createIdentifier(SdkImportWizard.typia(importer)),
                      "is",
                    ),
                    [
                      factory.createTypeReferenceNode(
                        SdkImportWizard.HttpError(importer),
                      ),
                    ],
                    [factory.createIdentifier("exp")],
                  ),
                ),
                factory.createThrowStatement(factory.createIdentifier("exp")),
              ),
              factory.createReturnStatement(
                factory.createAsExpression(
                  factory.createObjectLiteralExpression(
                    [
                      factory.createPropertyAssignment(
                        "success",
                        factory.createFalse(),
                      ),
                      factory.createPropertyAssignment(
                        "status",
                        factory.createIdentifier("exp.status"),
                      ),
                      factory.createPropertyAssignment(
                        "headers",
                        factory.createIdentifier("exp.headers"),
                      ),
                      factory.createPropertyAssignment(
                        "data",
                        factory.createIdentifier("exp.toJSON().message"),
                      ),
                    ],
                    true,
                  ),
                  TypeFactory.keyword("any"),
                ),
              ),
            ],
            true,
          ),
        ),
        undefined,
      );
}

const constant = (name: string) => (expression: Expression) =>
  factory.createVariableStatement(
    [factory.createModifier(SyntaxKind.ExportKeyword)],
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );
