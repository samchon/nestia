import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

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
          for (const instance of tuple[1])
            importer.internal({
              file: tuple[0],
              type: true,
              instance,
            });
      importer.internal({
        type: false,
        file: props.api,
        instance: null,
        name: "api",
      });

      const functor = generate_function(project)(importer)(route);
      await FilePrinter.write({
        location: importer.file,
        statements: [
          ...importer.toStatements(props.current),
          FilePrinter.enter(),
          functor,
        ],
      });
    };

  const generate_function =
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
              generate_arrow(project)(importer)(route),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );

  const generate_arrow =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute) => {
      const headers = route.parameters.find(
        (p) => p.category === "headers" && p.field === undefined,
      );
      const connection = headers
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
                      )("headers"),
                    ),
                    ts.factory.createSpreadAssignment(
                      ts.factory.createCallExpression(
                        IdentifierFactory.access(
                          ts.factory.createIdentifier(
                            SdkImportWizard.typia(importer),
                          ),
                        )("random"),
                        [getTypeName(project)(importer)(headers)],
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
      const caller = ts.factory.createCallExpression(
        ts.factory.createIdentifier(
          ["api", "functional", ...route.accessors].join("."),
        ),
        undefined,
        [
          connection,
          ...route.parameters
            .filter((p) => p.category !== "headers")
            .map((p) =>
              ts.factory.createCallExpression(
                IdentifierFactory.access(
                  ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
                )("random"),
                [getTypeName(project)(importer)(p)],
                undefined,
              ),
            ),
        ],
      );
      const assert = ts.factory.createCallExpression(
        IdentifierFactory.access(
          ts.factory.createIdentifier(SdkImportWizard.typia(importer)),
        )("assert"),
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
                    route.output.typeName === "void"
                    ? undefined
                    : SdkAliasCollection.output(project)(importer)(route),
                  ts.factory.createAwaitExpression(caller),
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
  ["test", "api", ...route.accessors].join("_");

const getTypeName =
  (project: INestiaProject) =>
  (importer: ImportDictionary) =>
  (p: ITypedHttpRoute.IParameter | ITypedHttpRoute.IOutput) =>
    p.metadata
      ? SdkTypeProgrammer.write(project)(importer)(p.metadata)
      : ts.factory.createTypeReferenceNode(p.typeName);
