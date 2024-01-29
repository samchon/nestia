import fs from "fs";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { FormatUtil } from "../../utils/FormatUtil";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkDtoGenerator } from "./SdkDtoGenerator";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeDefiner } from "./SdkTypeDefiner";

export namespace E2eFileProgrammer {
  export const generate =
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

      const functor = generate_function(config)(importer)(route);

      await fs.promises.writeFile(
        importer.file,
        await FormatUtil.beautify(
          ts
            .createPrinter()
            .printFile(
              ts.factory.createSourceFile(
                [
                  ...importer.toStatements(props.current),
                  FormatUtil.enter(),
                  functor,
                ],
                ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
                ts.NodeFlags.None,
              ),
            ),
        ),
        "utf8",
      );
    };

  const generate_function =
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
              generate_arrow(config)(importer)(route),
            ),
          ],
          ts.NodeFlags.Const,
        ),
      );

  const generate_arrow =
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
                        [
                          ts.factory.createTypeReferenceNode(
                            getTypeName(config)(importer)(headers),
                          ),
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
                [
                  ts.factory.createTypeReferenceNode(
                    getTypeName(config)(importer)(p),
                  ),
                ],
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
                  ts.factory.createTypeReferenceNode(
                    SdkTypeDefiner.output(config)(importer)(route),
                  ),
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
      ? SdkDtoGenerator.decode(config)(importer)(p.metadata)
      : p.typeName;
