import ts from "typescript";
import typia from "typia";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { INestiaConfig } from "../../INestiaConfig";
import { IController } from "../../structures/IController";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "../../utils/ImportDictionary";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkFunctionProgrammer {
  export const generate =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (
      route: IRoute,
      props: {
        headers: IRoute.IParameter | undefined;
        query: IRoute.IParameter | undefined;
        input: IRoute.IParameter | undefined;
      },
    ): ts.FunctionDeclaration => {
      return ts.factory.createFunctionDeclaration(
        [
          ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
          ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
        ],
        undefined,
        route.name,
        undefined,
        [
          IdentifierFactory.parameter(
            "connection",
            ts.factory.createTypeReferenceNode(
              SdkImportWizard.IConnection(importer),
              props.headers
                ? [ts.factory.createTypeReferenceNode(`${route.name}.Headers`)]
                : undefined,
            ),
          ),
          ...route.parameters
            .filter((p) => p.category !== "headers")
            .map((p) =>
              ts.factory.createParameterDeclaration(
                [],
                undefined,
                p.name,
                p.optional
                  ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
                  : undefined,
                config.primitive !== false &&
                  (p === props.query || p === props.input)
                  ? ts.factory.createTypeReferenceNode(
                      `${route.name}.${p === props.query ? "Query" : "Input"}`,
                    )
                  : getTypeName(config)(importer)(p),
              ),
            ),
        ],
        ts.factory.createTypeReferenceNode("Promise", [
          ts.factory.createTypeReferenceNode(
            config.propagate !== true && route.output.typeName === "void"
              ? "void"
              : `${route.name}.Output`,
          ),
        ]),
        ts.factory.createBlock(
          generate_body(config)(importer)(route, props),
          true,
        ),
      );
    };

  const generate_body =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (
      route: IRoute,
      props: {
        headers: IRoute.IParameter | undefined;
        query: IRoute.IParameter | undefined;
        input: IRoute.IParameter | undefined;
      },
    ): ts.Statement[] => {
      const encrypted: boolean =
        route.encrypted === true ||
        (props.input !== undefined &&
          props.input.custom === true &&
          props.input.category === "body" &&
          props.input.encrypted === true);
      const contentType: string | undefined =
        props.input !== undefined
          ? typia.is<IController.IBodyParameter>(props.input)
            ? props.input.contentType
            : "application/json"
          : undefined;

      const caller = () =>
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              SdkImportWizard.Fetcher(encrypted)(importer),
            ),
          )(config.propagate ? "propagate" : "fetch"),
          undefined,
          [
            contentType
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
                          ts.factory.createPropertyAssignment(
                            ts.factory.createStringLiteral("Content-Type"),
                            ts.factory.createStringLiteral(contentType),
                          ),
                        ],
                        true,
                      ),
                    ),
                  ],
                  true,
                )
              : ts.factory.createIdentifier("connection"),
            ts.factory.createObjectLiteralExpression(
              [
                ts.factory.createSpreadAssignment(
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(route.name),
                  )("METADATA"),
                ),
                ts.factory.createPropertyAssignment(
                  "path",
                  ts.factory.createCallExpression(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(route.name),
                    )("path"),
                    undefined,
                    route.parameters
                      .filter(
                        (p) => p.category === "param" || p.category === "query",
                      )
                      .map((p) => ts.factory.createIdentifier(p.name)),
                  ),
                ),
              ],
              true,
            ),
            ...(props.input
              ? [ts.factory.createIdentifier(props.input.name)]
              : []),
            ...(config.json && props.input?.category === "body"
              ? [ts.factory.createIdentifier(`${route.name}.stringify`)]
              : []),
          ],
        );
      return [
        ...(config.assert
          ? route.parameters
              .filter((p) => p.category !== "headers")
              .map((p) =>
                ts.factory.createExpressionStatement(
                  ts.factory.createCallExpression(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(
                        SdkImportWizard.typia(importer),
                      ),
                    )("assert"),
                    [
                      ts.factory.createTypeQueryNode(
                        ts.factory.createIdentifier(p.name),
                      ),
                    ],
                    [ts.factory.createIdentifier(p.name)],
                  ),
                ),
              )
          : []),
        ts.factory.createReturnStatement(
          config.simulate
            ? ts.factory.createConditionalExpression(
                ts.factory.createIdentifier("!!connection.simulate"),
                undefined,
                ts.factory.createCallExpression(
                  ts.factory.createIdentifier(`${route.name}.simulate`),
                  [],
                  [
                    ts.factory.createIdentifier("connection"),
                    ...route.parameters
                      .filter((p) => p.category !== "headers")
                      .map((p) => ts.factory.createIdentifier(p.name)),
                  ],
                ),
                undefined,
                caller(),
              )
            : caller(),
        ),
      ];
    };
}

const getTypeName =
  (config: INestiaConfig) =>
  (importer: ImportDictionary) =>
  (p: IRoute.IParameter | IRoute.IOutput) =>
    p.metadata
      ? SdkTypeProgrammer.decode(config)(importer)(p.metadata)
      : ts.factory.createTypeReferenceNode(p.typeName);
