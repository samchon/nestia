import { Node, NodeFlags, SyntaxKind, TypeScriptFactory } from "@nestia/factory";
import { ExpressionFactory, IdentifierFactory, LiteralFactory, StatementFactory, TypeFactory } from "@nestia/factory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";
import { sizeOf } from "../../internal/legacy";

export namespace SdkHttpSimulationProgrammer {
  export const random =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Node => {
      const output = SdkAliasCollection.responseBody(project)(importer)(route);
      return constant("random")(
        TypeScriptFactory.createArrowFunction(
          undefined,
          undefined,
          [],
          project.config.primitive === false
            ? output
            : TypeScriptFactory.createTypeReferenceNode(
                SdkImportWizard.Resolved(importer),
                [output],
              ),
          undefined,
          TypeScriptFactory.createCallExpression(
            IdentifierFactory.access(
              TypeScriptFactory.createIdentifier(
                SdkImportWizard.typia(importer),
              ),
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
      const output: boolean =
        project.config.propagate === true ||
        sizeOf(route.success.metadata) !== 0;
      const caller = () =>
        TypeScriptFactory.createCallExpression(
          TypeScriptFactory.createIdentifier("random"),
          undefined,
          undefined,
        );
      return constant("simulate")(
        TypeScriptFactory.createArrowFunction(
          undefined,
          undefined,
          [
            IdentifierFactory.parameter(
              SdkHttpParameterProgrammer.getSignificant(route, true).length !==
                0
                ? "connection"
                : "_connection",
              TypeScriptFactory.createTypeReferenceNode(
                SdkImportWizard.IConnection(importer),
                route.headerObject
                  ? [
                      TypeScriptFactory.createTypeReferenceNode(
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
          TypeScriptFactory.createTypeReferenceNode(output ? "Output" : "void"),
          undefined,
          TypeScriptFactory.createBlock(
            [
              ...assert(project)(importer)(route),
              TypeScriptFactory.createReturnStatement(
                project.config.propagate
                  ? TypeScriptFactory.createAsExpression(
                      TypeScriptFactory.createObjectLiteralExpression(
                        [
                          TypeScriptFactory.createPropertyAssignment(
                            "success",
                            TypeScriptFactory.createTrue(),
                          ),
                          TypeScriptFactory.createPropertyAssignment(
                            "status",
                            ExpressionFactory.number(
                              route.success.status ??
                                (route.method === "POST" ? 201 : 200),
                            ),
                          ),
                          TypeScriptFactory.createPropertyAssignment(
                            "headers",
                            LiteralFactory.write({
                              "Content-Type": route.success.contentType,
                            }),
                          ),
                          TypeScriptFactory.createPropertyAssignment(
                            "data",
                            caller(),
                          ),
                        ],
                        true,
                      ),
                      TypeScriptFactory.createTypeReferenceNode("Output"),
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
    (route: ITypedHttpRoute): Node[] => {
      const parameters = SdkHttpParameterProgrammer.getSignificant(route, true);
      if (parameters.length === 0) return [];

      const typia = SdkImportWizard.typia(importer);
      const validator = StatementFactory.constant({
        name: "assert",
        value: TypeScriptFactory.createCallExpression(
          IdentifierFactory.access(
            TypeScriptFactory.createIdentifier(
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
            TypeScriptFactory.createObjectLiteralExpression(
              [
                TypeScriptFactory.createPropertyAssignment(
                  "method",
                  TypeScriptFactory.createIdentifier("METADATA.method"),
                ),
                TypeScriptFactory.createPropertyAssignment(
                  "host",
                  TypeScriptFactory.createIdentifier("connection.host"),
                ),
                TypeScriptFactory.createPropertyAssignment(
                  "path",
                  TypeScriptFactory.createCallExpression(
                    TypeScriptFactory.createIdentifier("path"),
                    undefined,
                    SdkHttpParameterProgrammer.getArguments({
                      project,
                      route,
                      body: false,
                    }),
                  ),
                ),
                TypeScriptFactory.createPropertyAssignment(
                  "contentType",
                  TypeScriptFactory.createIdentifier(
                    JSON.stringify(route.success.contentType),
                  ),
                ),
              ],
              true,
            ),
          ],
        ),
      });
      const individual: Node[] = parameters
        .map((p) =>
          TypeScriptFactory.createCallExpression(
            (() => {
              const base = IdentifierFactory.access(
                TypeScriptFactory.createIdentifier("assert"),
                p.category,
              );
              if (p.category !== "param") return base;
              return TypeScriptFactory.createCallExpression(base, undefined, [
                TypeScriptFactory.createStringLiteral(p.name),
              ]);
            })(),
            undefined,
            [
              TypeScriptFactory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                undefined,
                TypeScriptFactory.createCallExpression(
                  IdentifierFactory.access(
                    TypeScriptFactory.createIdentifier(typia),
                    "assert",
                  ),
                  undefined,
                  [
                    project.config.keyword === true
                      ? TypeScriptFactory.createIdentifier(`props.${p.name}`)
                      : TypeScriptFactory.createIdentifier(p.name),
                  ],
                ),
              ),
            ],
          ),
        )
        .map(TypeScriptFactory.createExpressionStatement) as Node[];
      return [
        validator,
        ...(project.config.propagate !== true
          ? individual
          : [tryAndCatch(importer)(individual)]),
      ];
    };

  const tryAndCatch =
    (importer: ImportDictionary) => (individual: Node[]) =>
      TypeScriptFactory.createTryStatement(
        TypeScriptFactory.createBlock(individual, true),
        TypeScriptFactory.createCatchClause(
          "exp",
          TypeScriptFactory.createBlock(
            [
              TypeScriptFactory.createIfStatement(
                TypeScriptFactory.createLogicalNot(
                  TypeScriptFactory.createCallExpression(
                    IdentifierFactory.access(
                      TypeScriptFactory.createIdentifier(
                        SdkImportWizard.typia(importer),
                      ),
                      "is",
                    ),
                    [
                      TypeScriptFactory.createTypeReferenceNode(
                        SdkImportWizard.HttpError(importer),
                      ),
                    ],
                    [TypeScriptFactory.createIdentifier("exp")],
                  ),
                ),
                TypeScriptFactory.createThrowStatement(
                  TypeScriptFactory.createIdentifier("exp"),
                ),
              ),
              TypeScriptFactory.createReturnStatement(
                TypeScriptFactory.createAsExpression(
                  TypeScriptFactory.createObjectLiteralExpression(
                    [
                      TypeScriptFactory.createPropertyAssignment(
                        "success",
                        TypeScriptFactory.createFalse(),
                      ),
                      TypeScriptFactory.createPropertyAssignment(
                        "status",
                        TypeScriptFactory.createIdentifier("exp.status"),
                      ),
                      TypeScriptFactory.createPropertyAssignment(
                        "headers",
                        TypeScriptFactory.createIdentifier("exp.headers"),
                      ),
                      TypeScriptFactory.createPropertyAssignment(
                        "data",
                        TypeScriptFactory.createIdentifier(
                          "exp.toJSON().message",
                        ),
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

const constant = (name: string) => (expression: Node) =>
  TypeScriptFactory.createVariableStatement(
    [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
    TypeScriptFactory.createVariableDeclarationList(
      [
        TypeScriptFactory.createVariableDeclaration(
          TypeScriptFactory.createIdentifier(name),
          undefined,
          undefined,
          expression,
        ),
      ],
      NodeFlags.Const,
    ),
  );
