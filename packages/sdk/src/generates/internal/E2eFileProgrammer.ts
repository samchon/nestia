import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { LiteralFactory } from "typia/lib/factories/LiteralFactory";

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
      if (project.config.clone !== true)
        for (const tuple of route.imports)
          for (const instance of tuple.instances)
            importer.internal({
              file: tuple.file,
              type: true,
              instance,
            });
      importer.internal({
        type: false,
        file: props.api,
        instance: null,
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
      ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(getFunctionName(route)),
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
        ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
        "random",
      );
      const connection = route.headerObject
        ? ts.factory.createObjectLiteralExpression(
            [
              ts.factory.createSpreadAssignment(
                ts.factory.createIdentifier("connection"),
              ),
              ts.factory.createPropertyAssignment(
                "headers",
                ts.factory.createObjectLiteralExpression(
                  [
                    ts.factory.createSpreadAssignment(
                      IdentifierFactory.access(
                        ts.factory.createIdentifier("connection"),
                        "headers",
                      ),
                    ),
                    ts.factory.createSpreadAssignment(
                      ts.factory.createCallExpression(
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
        : ts.factory.createIdentifier("connection");
      const entries = SdkHttpParameterProgrammer.getEntries({
        project,
        importer,
        route,
        body: true,
        e2e: true,
        prefix: ["api", "functional", ...route.accessor].join(".") + ".",
      });
      const fetch = ts.factory.createCallExpression(
        ts.factory.createIdentifier(
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
                      ts.factory.createCallExpression(
                        IdentifierFactory.access(
                          ts.factory.createIdentifier(
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
                ts.factory.createCallExpression(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(
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
      const assert = ts.factory.createCallExpression(
        IdentifierFactory.access(
          ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
          "assert",
        ),
        undefined,
        [ts.factory.createIdentifier("output")],
      );

      return ts.factory.createArrowFunction(
        [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            ts.factory.createTypeReferenceNode("api.IConnection"),
          ),
        ],
        undefined,
        undefined,
        ts.factory.createBlock([
          ts.factory.createVariableStatement(
            [],
            ts.factory.createVariableDeclarationList(
              [
                ts.factory.createVariableDeclaration(
                  "output",
                  undefined,
                  project.config.propagate !== true &&
                    route.success.type.name === "void"
                    ? undefined
                    : SdkAliasCollection.response(project)(importer)(route),
                  ts.factory.createAwaitExpression(fetch),
                ),
              ],
              ts.NodeFlags.Const,
            ),
          ),
          ts.factory.createExpressionStatement(assert),
        ]),
      );
    };
}

const getFunctionName = (route: ITypedHttpRoute): string =>
  ["test", "api", ...route.accessor].join("_");
