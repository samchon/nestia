import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkAliasCollection } from "./SdkAliasCollection";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace E2eFileProgrammer {
  export const generate =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (props: { api: string; current: string }) =>
    async (route: IRoute): Promise<void> => {
      const importer: ImportDictionary = new ImportDictionary(
        `${props.current}/${getFunctionName(route)}.ts`,
      );
      if (config.clone !== true)
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

      const functor = generate_function(checker)(config)(importer)(route);
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
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (route: IRoute): ts.Statement =>
      ts.factory.createVariableStatement(
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createVariableDeclarationList(
          [
            ts.factory.createVariableDeclaration(
              ts.factory.createIdentifier(getFunctionName(route)),
              undefined,
              undefined,
              generate_arrow(checker)(config)(importer)(route),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );

  const generate_arrow =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (route: IRoute) => {
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
                        [getTypeName(config)(importer)(headers)],
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
                [getTypeName(config)(importer)(p)],
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
                  SdkAliasCollection.output(checker)(config)(importer)(route),
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

const getFunctionName = (route: IRoute): string =>
  ["test", "api", ...route.accessors].join("_");

const getTypeName =
  (config: INestiaConfig) =>
  (importer: ImportDictionary) =>
  (p: IRoute.IParameter | IRoute.IOutput) =>
    p.metadata
      ? SdkTypeProgrammer.write(config)(importer)(p.metadata)
      : ts.factory.createTypeReferenceNode(p.typeName);
