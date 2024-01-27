import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeDefiner } from "./SdkTypeDefiner";
import { SdkDtoGenerator } from "./SdkDtoGenerator";

export namespace SdkSimulationProgrammer {
  export const random =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (route: IRoute): ts.VariableStatement =>
      constant("random")(
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              "g",
              ts.factory.createToken(ts.SyntaxKind.QuestionToken),
              ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier("Partial"),
                [
                  ts.factory.createTypeReferenceNode(
                    `${SdkImportWizard.typia(importer)}.IRandomGenerator`,
                  ),
                ],
              ),
            ),
          ],
          undefined,
          undefined,
          ts.factory.createCallExpression(
            IdentifierFactory.access(
              ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
            )("random"),
            [
              ts.factory.createTypeReferenceNode(
                SdkTypeDefiner.responseBody(config)(importer)(route),
              ),
            ],
            [ts.factory.createIdentifier("g")],
          ),
        ),
      );

  export const simulate =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (
      route: IRoute,
      props: {
        headers: IRoute.IParameter | undefined;
        query: IRoute.IParameter | undefined;
        input: IRoute.IParameter | undefined;
      },
    ): ts.VariableStatement => {
      const output: boolean =
        config.propagate === true || route.output.typeName !== "void";
      return constant("simulate")(
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          [
            IdentifierFactory.parameter(
              "connection",
              ts.factory.createTypeReferenceNode(
                SdkImportWizard.IConnection(importer),
                route.parameters.some(
                  (p) => p.category === "headers" && p.field === undefined,
                )
                  ? [
                      ts.factory.createTypeReferenceNode(
                        `${route.name}.Headers`,
                      ),
                    ]
                  : [],
              ),
            ),
            ...route.parameters
              .filter(p => p.category !== "headers")
              .map(p =>
                ts.factory.createParameterDeclaration(
                  [],
                  undefined,
                  p.name,
                  p.optional
                    ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                    : undefined,
                  ts.factory.createTypeReferenceNode(
                    config.primitive !== false &&
                      (p === props.query || p === props.input)
                      ? `${route.name}.${p === props.query ? "Query" : "Input"}`
                      : getTypeName(config)(importer)(p),
                  ),
                ),
              ),
          ],
          ts.factory.createTypeReferenceNode(output ? "Output" : "void"),
          undefined,
          ts.factory.createBlock(
            [
              ...assert(config)(importer)(route),
              ts.factory.createReturnStatement(
                ts.factory.createCallExpression(
                  ts.factory.createIdentifier("random"),
                  undefined,
                  [
                    ts.factory.createConditionalExpression(
                      ts.factory.createLogicalAnd(
                        ts.factory.createStrictEquality(
                          ts.factory.createStringLiteral("object"),
                          ts.factory.createTypeOfExpression(
                            ts.factory.createIdentifier("connection.simulate"),
                          ),
                        ),
                        ts.factory.createStrictInequality(
                          ts.factory.createNull(),
                          ts.factory.createIdentifier("connection.simulate"),
                        ),
                      ),
                      undefined,
                      ts.factory.createIdentifier("connection.simulate"),
                      undefined,
                      ts.factory.createIdentifier("undefined"),
                    ),
                  ],
                ),
              ),
            ],
            true,
          ),
        ),
      );
    };

  const assert =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (route: IRoute): ts.Statement[] => {
      const parameters = route.parameters.filter(
        (p) => p.category !== "headers",
      );
      if (parameters.length === 0) return [];

      const typia = SdkImportWizard.typia(importer);
      const validator = StatementFactory.constant(
        "assert",
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              importer.internal({
                file: `${config.output}/utils/NestiaSimulator.ts`,
                instance: "NestiaSimulator",
                type: false,
              }),
            ),
          )("assert"),
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
                    route.parameters
                      .filter(
                        (p) => p.category === "param" || p.category === "query",
                      )
                      .map((p) => ts.factory.createIdentifier(p.name)),
                  ),
                ),
                ts.factory.createPropertyAssignment(
                  "contentType",
                  ts.factory.createIdentifier(
                    JSON.stringify(route.output.contentType),
                  ),
                ),
              ],
              true,
            ),
          ],
        ),
      );
      const individual = parameters
        .map((p) =>
          ts.factory.createCallExpression(
            IdentifierFactory.access(ts.factory.createIdentifier("assert"))(
              p.category,
            ),
            undefined,
            [
              ts.factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                ts.factory.createCallExpression(
                  (() => {
                    const base = IdentifierFactory.access(
                      ts.factory.createIdentifier(typia),
                    )("assert");
                    if (p.category !== "param") return base;
                    return ts.factory.createCallExpression(base, undefined, [
                      ts.factory.createStringLiteral(p.name),
                    ]);
                  })(),
                  undefined,
                  [
                    ts.factory.createIdentifier(
                      p.category === "headers" ? "connection.headers" : p.name,
                    ),
                  ],
                ),
              ),
            ],
          ),
        )
        .map(ts.factory.createExpressionStatement);

      return [
        validator,
        ...(config.propagate !== true
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
                ts.factory.createCallExpression(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(
                      SdkImportWizard.typia(importer),
                    ),
                  )("isNestiaError"),
                  [],
                  [],
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

const getTypeName =
  (config: INestiaConfig) =>
  (importer: ImportDictionary) =>
  (p: IRoute.IParameter | IRoute.IOutput) =>
    p.metadata
      ? SdkDtoGenerator.decode(config)(importer)(p.metadata)
      : p.typeName;