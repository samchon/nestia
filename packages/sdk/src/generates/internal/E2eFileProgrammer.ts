import { Node, NodeFlags, SyntaxKind, TypeScriptFactory } from "@nestia/factory";
import { IdentifierFactory, LiteralFactory } from "@typia/core";

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
      TypeScriptFactory.createVariableStatement(
        [TypeScriptFactory.createModifier(SyntaxKind.ExportKeyword)],
        TypeScriptFactory.createVariableDeclarationList(
          [
            TypeScriptFactory.createVariableDeclaration(
              TypeScriptFactory.createIdentifier(getFunctionName(route)),
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
        TypeScriptFactory.createIdentifier(SdkImportWizard.typia(importer)),
        "random",
      );
      const connection = route.headerObject
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
                    TypeScriptFactory.createSpreadAssignment(
                      TypeScriptFactory.createCallExpression(
                        random,
                        [
                          project.config.clone === true
                            ? SdkAliasCollection.from(project)(importer)(
                                route.headerObject.metadata,
                              )
                            : SdkAliasCollection.name(route.headerObject),
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
        : TypeScriptFactory.createIdentifier("connection");
      const entries = SdkHttpParameterProgrammer.getEntries({
        project,
        importer,
        route,
        body: true,
        e2e: true,
        prefix: ["api", "functional", ...route.accessor].join(".") + ".",
      });
      const fetch = TypeScriptFactory.createCallExpression(
        TypeScriptFactory.createIdentifier(
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
                      TypeScriptFactory.createCallExpression(
                        IdentifierFactory.access(
                          TypeScriptFactory.createIdentifier(
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
                TypeScriptFactory.createCallExpression(
                  IdentifierFactory.access(
                    TypeScriptFactory.createIdentifier(
                      SdkImportWizard.typia(importer),
                    ),
                    "random",
                  ),
                  [getRandomType(importer)(e)],
                  undefined,
                ),
              )),
        ],
      );
      const assert = TypeScriptFactory.createCallExpression(
        IdentifierFactory.access(
          TypeScriptFactory.createIdentifier(SdkImportWizard.typia(importer)),
          "assert",
        ),
        undefined,
        [TypeScriptFactory.createIdentifier("output")],
      );

      return TypeScriptFactory.createArrowFunction(
        [TypeScriptFactory.createModifier(SyntaxKind.AsyncKeyword)],
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            TypeScriptFactory.createTypeReferenceNode("api.IConnection"),
          ),
        ],
        undefined,
        undefined,
        TypeScriptFactory.createBlock([
          TypeScriptFactory.createVariableStatement(
            [],
            TypeScriptFactory.createVariableDeclarationList(
              [
                TypeScriptFactory.createVariableDeclaration(
                  "output",
                  undefined,
                  project.config.propagate !== true &&
                    route.success.type.name === "void"
                    ? undefined
                    : SdkAliasCollection.response(project)(importer)(route),
                  TypeScriptFactory.createAwaitExpression(fetch),
                ),
              ],
              NodeFlags.Const,
            ),
          ),
          TypeScriptFactory.createExpressionStatement(assert),
        ]),
      );
    };
}

const getRandomType =
  (importer: ImportDictionary) =>
  (entry: SdkHttpParameterProgrammer.IEntry): Node => {
    if (isPlainStringPathParameter(entry) === false) return entry.type;
    return TypeScriptFactory.createIntersectionTypeNode([
      entry.type,
      TypeScriptFactory.createTypeReferenceNode(
        TypeScriptFactory.createQualifiedName(
          TypeScriptFactory.createIdentifier(
            importer.external({
              declaration: true,
              file: "typia",
              type: "element",
              name: "tags",
            }),
          ),
          TypeScriptFactory.createIdentifier("MinLength"),
        ),
        [
          TypeScriptFactory.createLiteralTypeNode(
            LiteralFactory.write(1) as Node,
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
