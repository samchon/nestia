import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { StatementFactory } from "typia/lib/factories/StatementFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { ISwaggerComponents } from "../structures/ISwaggerComponents";
import { MigrateApiFunctionProgrammer } from "./MigrateApiFunctionProgrammer";
import { MigrateApiNamespaceProgrammer } from "./MigrateApiNamespaceProgrammer";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateApiSimulatationProgrammer {
  export interface IProps {
    controller: IMigrateController;
    route: IMigrateRoute;
    alias: string;
  }
  export const random =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps) =>
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
                    `${importer.external({
                      type: "default",
                      library: "typia",
                      name: "typia",
                    })}.IRandomGenerator`,
                  ),
                ],
              ),
            ),
          ],
          undefined,
          undefined,
          ts.factory.createCallExpression(
            IdentifierFactory.access(
              ts.factory.createIdentifier(
                importer.external({
                  type: "default",
                  library: "typia",
                  name: "typia",
                }),
              ),
            )("random"),
            [
              props.route.success
                ? MigrateSchemaProgrammer.write(components)(importer)(
                    props.route.success.schema,
                  )
                : TypeFactory.keyword("void"),
            ],
            [ts.factory.createIdentifier("g")],
          ),
        ),
      );

  export const simulate =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.VariableStatement => {
      const caller = () =>
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
        );
      assert;
      return constant("simulate")(
        ts.factory.createArrowFunction(
          undefined,
          undefined,
          MigrateApiFunctionProgrammer.writeParameterDeclarations(components)(
            importer,
          )(props),
          ts.factory.createTypeReferenceNode(
            props.route.success ? "Output" : "void",
          ),
          undefined,
          ts.factory.createBlock(
            [
              ...assert(components)(importer)(props),
              ts.factory.createReturnStatement(caller()),
            ],
            true,
          ),
        ),
      );
    };

  const assert =
    (components: ISwaggerComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.Statement[] => {
      const parameters = [
        ...props.route.parameters.map((p) => ({
          category: "param",
          name: p.key,
          schema: MigrateSchemaProgrammer.write(components)(importer)(p.schema),
        })),
        ...(props.route.query
          ? [
              {
                category: "query",
                name: props.route.query.key,
                schema: MigrateSchemaProgrammer.write(components)(importer)(
                  props.route.query.schema,
                ),
              },
            ]
          : []),
        ...(props.route.body
          ? [
              {
                category: "body",
                name: props.route.body.key,
                schema: MigrateSchemaProgrammer.write(components)(importer)(
                  props.route.body.schema,
                ),
              },
            ]
          : []),
      ];
      if (parameters.length === 0) return [];

      const validator = StatementFactory.constant(
        "assert",
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              importer.external({
                type: "instance",
                library: `@nestia/fetcher/lib/NestiaSimulator`,
                name: "NestiaSimulator",
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
                  MigrateApiNamespaceProgrammer.writePathCallExpression(props),
                ),
                ts.factory.createPropertyAssignment(
                  "contentType",
                  ts.factory.createStringLiteral(
                    props.route.success?.type ?? "application/json",
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
            (() => {
              const base = IdentifierFactory.access(
                ts.factory.createIdentifier("assert"),
              )(p.category);
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
                    ts.factory.createIdentifier(
                      importer.external({
                        type: "default",
                        library: "typia",
                        name: "typia",
                      }),
                    ),
                  )("assert"),
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
      return [validator, tryAndCatch(importer)(individual)];
    };

  const tryAndCatch =
    (importer: MigrateImportProgrammer) => (individual: ts.Statement[]) =>
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
                        importer.external({
                          type: "default",
                          library: "typia",
                          name: "typia",
                        }),
                      ),
                    )("is"),
                    [
                      ts.factory.createTypeReferenceNode(
                        importer.external({
                          type: "instance",
                          library: "@nestia/fetcher",
                          name: "HttpError",
                        }),
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
