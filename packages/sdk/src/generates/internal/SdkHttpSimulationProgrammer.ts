import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

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
    (route: ITypedHttpRoute): ts.VariableStatement => {
      const output = SdkAliasCollection.responseBody(project)(importer)(route);
      return constant("random")(
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [],
          project.config.primitive === false
            ? output
            : ts.factory.createTypeReferenceNode(
                SdkImportWizard.Resolved(importer),
                [output],
              ),
          undefined,
          ts.factory.createCallExpression(
            IdentifierFactory.access(
              ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
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
    (route: ITypedHttpRoute): ts.VariableStatement => {
      const output: boolean =
        project.config.propagate === true ||
        route.success.metadata.size() !== 0;
      const caller = () =>
        ts.factory.createCallExpression(
          ts.factory.createIdentifier("random"),
          undefined,
          undefined,
        );
      return constant("simulate")(
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [
            IdentifierFactory.parameter(
              "connection",
              ts.factory.createTypeReferenceNode(
                SdkImportWizard.IConnection(importer),
                route.headerObject
                  ? [
                      ts.factory.createTypeReferenceNode(
                        `${route.name}.Headers`,
                      ),
                    ]
                  : [],
              ),
            ),
            ...SdkHttpParameterProgrammer.getParameterDeclarations({
              project,
              importer,
              route,
              body: true,
              prefix: false,
            }),
          ],
          ts.factory.createTypeReferenceNode(output ? "Output" : "void"),
          undefined,
          ts.factory.createBlock(
            [
              ...assert(project)(importer)(route),
              ts.factory.createReturnStatement(
                project.config.propagate
                  ? ts.factory.createAsExpression(
                      ts.factory.createObjectLiteralExpression(
                        [
                          ts.factory.createPropertyAssignment(
                            "success",
                            ts.factory.createTrue(),
                          ),
                          ts.factory.createPropertyAssignment(
                            "status",
                            ExpressionFactory.number(
                              route.success.status ??
                                (route.method === "POST" ? 201 : 200),
                            ),
                          ),
                          ts.factory.createPropertyAssignment(
                            "headers",
                            LiteralFactory.write({
                              "Content-Type": route.success.contentType,
                            }),
                          ),
                          ts.factory.createPropertyAssignment("data", caller()),
                        ],
                        true,
                      ),
                      ts.factory.createTypeReferenceNode("Output"),
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
    (route: ITypedHttpRoute): ts.Statement[] => {
      const parameters = SdkHttpParameterProgrammer.getSignificant(route, true);
      if (parameters.length === 0)
        return [
          ts.factory.createExpressionStatement(
            ts.factory.createIdentifier("connection"),
          ),
        ];

      const typia = SdkImportWizard.typia(importer);
      const validator = StatementFactory.constant({
        name: "assert",
        value: ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              importer.external({
                type: false,
                library: `@nestia/fetcher/lib/NestiaSimulator`,
                instance: "NestiaSimulator",
              }),
            ),
            "assert",
          ),
          undefined,
          [
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createPropertyAssignment(
                  "method",
                  ts.factory.createIdentifier("METADATA.method"),
                ),
                ts.factory.createPropertyAssignment(
                  "host",
                  ts.factory.createIdentifier("connection.host"),
                ),
                ts.factory.createPropertyAssignment(
                  "path",
                  ts.factory.createCallExpression(
                    ts.factory.createIdentifier("path"),
                    undefined,
                    SdkHttpParameterProgrammer.getArguments({
                      project,
                      route,
                      body: false,
                    }),
                  ),
                ),
                ts.factory.createPropertyAssignment(
                  "contentType",
                  ts.factory.createIdentifier(
                    JSON.stringify(route.success.contentType),
                  ),
                ),
              ],
              true,
            ),
          ],
        ),
      });
      const individual = parameters
        .map((p) =>
          ts.factory.createCallExpression(
            (() => {
              const base = IdentifierFactory.access(
                ts.factory.createIdentifier("assert"),
                p.category,
              );
              if (p.category !== "param") return base;
              return ts.factory.createCallExpression(base, undefined, [
                ts.factory.createStringLiteral(p.name),
              ]);
            })(),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                ts.factory.createCallExpression(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(typia),
                    "assert",
                  ),
                  undefined,
                  [
                    project.config.keyword === true
                      ? ts.factory.createIdentifier(`props.${p.name}`)
                      : ts.factory.createIdentifier(p.name),
                  ],
                ),
              ),
            ],
          ),
        )
        .map(ts.factory.createExpressionStatement);
      return [
        validator,
        ...(project.config.propagate !== true
          ? individual
          : [tryAndCatch(importer)(individual)]),
      ];
    };

  const tryAndCatch =
    (importer: ImportDictionary) => (individual: ts.Statement[]) =>
      ts.factory.createTryStatement(
        ts.factory.createBlock(individual, true),
        ts.factory.createCatchClause(
          "exp",
          ts.factory.createBlock(
            [
              ts.factory.createIfStatement(
                ts.factory.createLogicalNot(
                  ts.factory.createCallExpression(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(
                        SdkImportWizard.typia(importer),
                      ),
                      "is",
                    ),
                    [
                      ts.factory.createTypeReferenceNode(
                        SdkImportWizard.HttpError(importer),
                      ),
                    ],
                    [ts.factory.createIdentifier("exp")],
                  ),
                ),
                ts.factory.createThrowStatement(
                  ts.factory.createIdentifier("exp"),
                ),
              ),
              ts.factory.createReturnStatement(
                ts.factory.createAsExpression(
                  ts.factory.createObjectLiteralExpression(
                    [
                      ts.factory.createPropertyAssignment(
                        "success",
                        ts.factory.createFalse(),
                      ),
                      ts.factory.createPropertyAssignment(
                        "status",
                        ts.factory.createIdentifier("exp.status"),
                      ),
                      ts.factory.createPropertyAssignment(
                        "headers",
                        ts.factory.createIdentifier("exp.headers"),
                      ),
                      ts.factory.createPropertyAssignment(
                        "data",
                        ts.factory.createIdentifier("exp.toJSON().message"),
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

const constant = (name: string) => (expression: ts.Expression) =>
  ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier(name),
          undefined,
          undefined,
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
