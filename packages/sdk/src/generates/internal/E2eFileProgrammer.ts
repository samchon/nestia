import {
  type Node,
  NodeFlags,
  type NumericLiteral,
  SyntaxKind,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { IdentifierFactory } from "../../factories/IdentifierFactory";
import { LiteralFactory } from "../../factories/LiteralFactory";
import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkImportWizard } from "./SdkImportWizard";

export namespace E2eFileProgrammer {
  export const generate =
    (project: INestiaProject) =>
    (props: { api: string; current: string }) =>
    async (route: ITypedHttpRoute): Promise<void> => {
      const importer: ImportDictionary = new ImportDictionary(
        `${props.current}/${getFunctionName(route)}.ts`,
      );
      if (project.config.clone !== true) importer.declarations(route.imports);
      importer.internal({
        file: props.api,
        declaration: false,
        type: "default",
        name: "api",
      });
      const functor: Node = generateFunctor(project)(importer)(route);
      await FilePrinter.write({
        location: importer.file,
        statements: [
          ...importer.toStatements(props.current),
          FilePrinter.enter(),
          functor,
        ],
      });
    };

  const generateFunctor =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): Node =>
      factory.createVariableStatement(
        [factory.createModifier(SyntaxKind.ExportKeyword)],
        factory.createVariableDeclarationList(
          [
            factory.createVariableDeclaration(
              factory.createIdentifier(getFunctionName(route)),
              undefined,
              undefined,
              generateArrow(project)(importer)(route),
            ),
          ],
          NodeFlags.Const,
        ),
      );

  const generateArrow =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) => {
      const random = IdentifierFactory.access(
        factory.createIdentifier(SdkImportWizard.typia(importer)),
        "random",
      );
      const connection = route.headerObject
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
                    factory.createSpreadAssignment(
                      factory.createCallExpression(
                        random,
                        [
                          (project.config.clone === true
                            ? SdkAliasCollection.from(project)(importer)(
                                route.headerObject.metadata,
                              )
                            : SdkAliasCollection.name(
                                route.headerObject,
                              )) as TypeNode,
                        ],
                        undefined,
                      ),
                    ),
                  ],
                  true,
                ),
              ),
            ],
            true,
          )
        : factory.createIdentifier("connection");
      const entries = SdkHttpParameterProgrammer.getEntries({
        project,
        importer,
        route,
        body: true,
        e2e: true,
        prefix: ["api", "functional", ...route.accessor].join(".") + ".",
      });
      const fetch = factory.createCallExpression(
        factory.createIdentifier(
          ["api", "functional", ...route.accessor].join("."),
        ),
        undefined,
        [
          connection,
          ...(project.config.keyword === true && entries.length !== 0
            ? [
                LiteralFactory.write(
                  Object.fromEntries(
                    entries.map((e) => [
                      e.key,
                      factory.createCallExpression(
                        IdentifierFactory.access(
                          factory.createIdentifier(
                            SdkImportWizard.typia(importer),
                          ),
                          "random",
                        ),
                        [getRandomType(importer)(e)],
                        undefined,
                      ),
                    ]),
                  ),
                ),
              ]
            : entries.map((e) =>
                factory.createCallExpression(
                  IdentifierFactory.access(
                    factory.createIdentifier(SdkImportWizard.typia(importer)),
                    "random",
                  ),
                  [getRandomType(importer)(e)],
                  undefined,
                ),
              )),
        ],
      );
      const assert = factory.createCallExpression(
        IdentifierFactory.access(
          factory.createIdentifier(SdkImportWizard.typia(importer)),
          "assert",
        ),
        undefined,
        [factory.createIdentifier("output")],
      );

      return factory.createArrowFunction(
        [factory.createModifier(SyntaxKind.AsyncKeyword)],
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            factory.createTypeReferenceNode("api.IConnection"),
          ),
        ],
        undefined,
        undefined,
        factory.createBlock([
          factory.createVariableStatement(
            [],
            factory.createVariableDeclarationList(
              [
                factory.createVariableDeclaration(
                  "output",
                  undefined,
                  project.config.propagate !== true &&
                    route.success.type!.name === "void"
                    ? undefined
                    : (SdkAliasCollection.response(project)(importer)(
                        route,
                      ) as TypeNode),
                  factory.createAwaitExpression(fetch),
                ),
              ],
              NodeFlags.Const,
            ),
          ),
          ...(route.success.binary === true
            ? []
            : [factory.createExpressionStatement(assert)]),
        ]),
      );
    };
}

const getRandomType =
  (importer: ImportDictionary) =>
  (entry: SdkHttpParameterProgrammer.IEntry): TypeNode => {
    if (isPlainStringPathParameter(entry) === false)
      return entry.type as TypeNode;
    return factory.createIntersectionTypeNode([
      entry.type as TypeNode,
      factory.createTypeReferenceNode(
        factory.createQualifiedName(
          factory.createIdentifier(
            importer.external({
              declaration: true,
              file: "typia",
              type: "element",
              name: "tags",
            }),
          ),
          factory.createIdentifier("MinLength"),
        ),
        [
          factory.createLiteralTypeNode(
            LiteralFactory.write(1) as NumericLiteral,
          ),
        ],
      ),
    ]);
  };

const isPlainStringPathParameter = (
  entry: SdkHttpParameterProgrammer.IEntry,
): boolean =>
  entry.parameter.category === "param" &&
  entry.parameter.metadata.atomics.length === 1 &&
  entry.parameter.metadata.atomics[0]!.type === "string" &&
  entry.parameter.metadata.atomics[0]!.tags.every((row) =>
    row.every((tag) => tag.kind !== "minLength"),
  );

const getFunctionName = (route: ITypedHttpRoute): string =>
  ["test", "api", ...route.accessor].join("_");
