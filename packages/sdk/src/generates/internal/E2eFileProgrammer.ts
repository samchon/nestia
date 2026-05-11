import { TypeScriptFactory } from "@nestia/factory";
import { IdentifierFactory, LiteralFactory } from "@typia/core";
import ts from "typescript";

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
      const functor: ts.Statement = generateFunctor(project)(importer)(route);
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
    (route: ITypedHttpRoute): ts.Statement =>
      TypeScriptFactory.createVariableStatement(
        [TypeScriptFactory.createModifier(ts.SyntaxKind.ExportKeyword)],
        TypeScriptFactory.createVariableDeclarationList(
          [
            TypeScriptFactory.createVariableDeclaration(
              TypeScriptFactory.createIdentifier(getFunctionName(route)),
              undefined,
              undefined,
              generateArrow(project)(importer)(route),
            ),
          ],
          ts.NodeFlags.Const,
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
                        [e.type],
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
                  [e.type],
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
        [TypeScriptFactory.createModifier(ts.SyntaxKind.AsyncKeyword)],
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
              ts.NodeFlags.Const,
            ),
          ),
          TypeScriptFactory.createExpressionStatement(assert),
        ]),
      );
    };
}

const getFunctionName = (route: ITypedHttpRoute): string =>
  ["test", "api", ...route.accessor].join("_");
