import { OpenApi } from "@samchon/openapi";
import ts from "typescript";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";

import { IMigrateController } from "../structures/IMigrateController";
import { IMigrateProgram } from "../structures/IMigrateProgram";
import { IMigrateRoute } from "../structures/IMigrateRoute";
import { FilePrinter } from "../utils/FilePrinter";
import { MigrateImportProgrammer } from "./MigrateImportProgrammer";
import { MigrateSchemaProgrammer } from "./MigrateSchemaProgrammer";

export namespace MigrateApiFunctionProgrammer {
  export interface IProps {
    controller: IMigrateController;
    route: IMigrateRoute;
    alias: string;
  }

  export const write =
    (config: IMigrateProgram.IConfig) =>
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.FunctionDeclaration =>
      FilePrinter.description(
        ts.factory.createFunctionDeclaration(
          [
            ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
            ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
          ],
          undefined,
          props.alias,
          undefined,
          writeParameterDeclarations(components)(importer)(props),
          ts.factory.createTypeReferenceNode("Promise", [
            ts.factory.createTypeReferenceNode(
              props.route.success === null ? "void" : `${props.alias}.Output`,
            ),
          ]),
          ts.factory.createBlock(writeBody(config)(importer)(props), true),
        ),
        writeDescription(props),
      );

  export const writeParameterDeclarations =
    (components: OpenApi.IComponents) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.ParameterDeclaration[] => [
      IdentifierFactory.parameter(
        "connection",
        ts.factory.createTypeReferenceNode(
          importer.external({
            type: "instance",
            library: "@nestia/fetcher",
            name: "IConnection",
          }),
          props.route.headers
            ? [ts.factory.createTypeReferenceNode(`${props.alias}.Headers`)]
            : undefined,
        ),
      ),
      ...props.route.parameters.map((p) =>
        IdentifierFactory.parameter(
          p.key,
          MigrateSchemaProgrammer.write(components)(importer)(p.schema),
        ),
      ),
      ...(props.route.query
        ? [
            IdentifierFactory.parameter(
              props.route.query.key,
              ts.factory.createTypeReferenceNode(`${props.alias}.Query`),
            ),
          ]
        : []),
      ...(props.route.body
        ? [
            IdentifierFactory.parameter(
              props.route.body.key,
              ts.factory.createTypeReferenceNode(`${props.alias}.Input`),
            ),
          ]
        : []),
    ];

  const writeDescription = (props: IProps): string =>
    [
      props.route.comment(),
      `@controller ${props.controller.name}`,
      `@path ${props.route.path}`,
      "@nestia Generated by Nestia - https://github.com/samchon/nestia",
    ].join("\n");

  const writeBody =
    (config: IMigrateProgram.IConfig) =>
    (importer: MigrateImportProgrammer) =>
    (props: IProps): ts.Statement[] => {
      const encrypted: boolean = !!props.route.success?.["x-nestia-encrypted"];
      const contentType: string = props.route.body?.type ?? "application/json";

      const caller = () =>
        ts.factory.createCallExpression(
          IdentifierFactory.access(
            ts.factory.createIdentifier(
              importer.external({
                type: "instance",
                library: `@nestia/fetcher/lib/${encrypted ? "EncryptedFetcher" : "PlainFetcher"}`,
                name: encrypted ? "EncryptedFetcher" : "PlainFetcher",
              }),
            ),
          )("fetch"),
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
                    ts.factory.createIdentifier(props.alias),
                  )("METADATA"),
                ),
                ts.factory.createPropertyAssignment(
                  "path",
                  ts.factory.createCallExpression(
                    IdentifierFactory.access(
                      ts.factory.createIdentifier(props.alias),
                    )("path"),
                    undefined,
                    [
                      ...props.route.parameters.map((p) =>
                        ts.factory.createIdentifier(p.key),
                      ),
                      ...(props.route.query
                        ? [ts.factory.createIdentifier(props.route.query.key)]
                        : []),
                    ],
                  ),
                ),
                ts.factory.createPropertyAssignment(
                  "status",
                  ts.factory.createNull(),
                ),
              ],
              true,
            ),
            ...(props.route.body
              ? [ts.factory.createIdentifier(props.route.body.key)]
              : []),
          ],
        );
      if (config.simulate !== true)
        return [ts.factory.createReturnStatement(caller())];
      return [
        ts.factory.createReturnStatement(
          ts.factory.createConditionalExpression(
            ts.factory.createIdentifier("!!connection.simulate"),
            undefined,
            ts.factory.createCallExpression(
              ts.factory.createIdentifier(`${props.alias}.simulate`),
              [],
              [
                "connection",
                ...props.route.parameters.map((p) => p.key),
                ...(props.route.query ? [props.route.query.key] : []),
                ...(props.route.body ? [props.route.body.key] : []),
              ].map((key) => ts.factory.createIdentifier(key)),
            ),
            undefined,
            caller(),
          ),
        ),
      ];
    };
}