import ts from "typescript";
import typia from "typia";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { INestiaConfig } from "../../INestiaConfig";
import { INestiaProject } from "../../structures/INestiaProject";
import { IReflectHttpOperation } from "../../structures/IReflectHttpOperation";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { StringUtil } from "../../utils/StringUtil";
import { ImportDictionary } from "./ImportDictionary";
import { SdkImportWizard } from "./SdkImportWizard";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkHttpFunctionProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRoute.IParameter | undefined;
        query: ITypedHttpRoute.IParameter | undefined;
        input: ITypedHttpRoute.IParameter | undefined;
      },
    ): ts.FunctionDeclaration =>
      ts.factory.createFunctionDeclaration(
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
                project.config.primitive !== false &&
                  (p === props.query || p === props.input)
                  ? ts.factory.createTypeReferenceNode(
                      `${route.name}.${p === props.query ? "Query" : "Input"}`,
                    )
                  : getTypeName(project)(importer)(p),
              ),
            ),
        ],
        ts.factory.createTypeReferenceNode("Promise", [
          getReturnType(project.config)(route),
        ]),
        ts.factory.createBlock(
          write_body(project.config)(importer)(route, props),
          true,
        ),
      );

  const write_body =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (
      route: ITypedHttpRoute,
      props: {
        headers: ITypedHttpRoute.IParameter | undefined;
        query: ITypedHttpRoute.IParameter | undefined;
        input: ITypedHttpRoute.IParameter | undefined;
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
          ? typia.is<IReflectHttpOperation.IBodyParameter>(props.input)
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
            contentType && contentType !== "multipart/form-data"
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
                  "template",
                  IdentifierFactory.access(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(route.name),
                    )("METADATA"),
                  )("path"),
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
            ...(config.json &&
            typia.is<IReflectHttpOperation.IBodyParameter>(props.input) &&
            (props.input.contentType === "application/json" ||
              props.input.encrypted === true)
              ? [ts.factory.createIdentifier(`${route.name}.stringify`)]
              : []),
          ],
        );
      const output = (awaiter: boolean) =>
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
              awaiter ? ts.factory.createAwaitExpression(caller()) : caller(),
            )
          : awaiter
            ? ts.factory.createAwaitExpression(caller())
            : caller();
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
        ...(route.setHeaders.length === 0
          ? [ts.factory.createReturnStatement(output(false))]
          : write_set_headers(config)(route)(output(true))),
      ];
    };

  const write_set_headers =
    (config: INestiaConfig) =>
    (route: ITypedHttpRoute) =>
    (condition: ts.Expression): ts.Statement[] => {
      const accessor = (x: string) => (y: string) =>
        x[0] === "[" ? `${x}${y}` : `${x}.${y}`;
      const output: string = StringUtil.escapeDuplicate([
        "connection",
        ...route.parameters.map((p) => p.name),
      ])("output");
      const headers: string = accessor("connection")("headers");
      const data: string = config.propagate ? accessor(output)("data") : output;

      const assigners: ts.ExpressionStatement[] = [
        ts.factory.createBinaryExpression(
          ts.factory.createIdentifier(headers),
          ts.factory.createToken(ts.SyntaxKind.QuestionQuestionEqualsToken),
          ts.factory.createObjectLiteralExpression([]),
        ),
        ...route.setHeaders.map((tuple) =>
          tuple.type === "assigner"
            ? ts.factory.createCallExpression(
                ts.factory.createIdentifier("Object.assign"),
                [],
                [
                  ts.factory.createIdentifier(headers),
                  ts.factory.createIdentifier(accessor(data)(tuple.source)),
                ],
              )
            : ts.factory.createBinaryExpression(
                ts.factory.createIdentifier(
                  accessor(headers)(tuple.target ?? tuple.source),
                ),
                ts.factory.createToken(ts.SyntaxKind.EqualsToken),
                ts.factory.createIdentifier(accessor(data)(tuple.source)),
              ),
        ),
      ].map(ts.factory.createExpressionStatement);
      return [
        ts.factory.createVariableStatement(
          [],
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                output,
                undefined,
                getReturnType(config)(route),
                condition,
              ),
            ],
            ts.NodeFlags.Const,
          ),
        ),
        ...(config.propagate
          ? [
              ts.factory.createIfStatement(
                ts.factory.createIdentifier(accessor(output)("success")),
                assigners.length === 1
                  ? assigners[0]
                  : ts.factory.createBlock(assigners, true),
                undefined,
              ),
            ]
          : assigners),
        ts.factory.createReturnStatement(ts.factory.createIdentifier(output)),
      ];
    };
}

const getTypeName =
  (project: INestiaProject) =>
  (importer: ImportDictionary) =>
  (p: ITypedHttpRoute.IParameter | ITypedHttpRoute.IOutput) =>
    p.metadata
      ? SdkTypeProgrammer.write(project)(importer)(p.metadata)
      : ts.factory.createTypeReferenceNode(p.typeName);

const getReturnType = (config: INestiaConfig) => (route: ITypedHttpRoute) =>
  ts.factory.createTypeReferenceNode(
    config.propagate !== true && route.output.typeName === "void"
      ? "void"
      : `${route.name}.Output`,
  );
