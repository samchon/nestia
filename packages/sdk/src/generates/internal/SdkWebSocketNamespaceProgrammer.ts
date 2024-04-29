import ts from "typescript";
import { ExpressionFactory } from "typia/lib/factories/ExpressionFactory";
import { IdentifierFactory } from "typia/lib/factories/IdentifierFactory";
import { TypeFactory } from "typia/lib/factories/TypeFactory";

import { INestiaProject } from "../../structures/INestiaProject";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkWebSocketNamespaceProgrammer {
  export const write =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.ModuleDeclaration =>
      ts.factory.createModuleDeclaration(
        [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
        ts.factory.createIdentifier(route.name),
        ts.factory.createModuleBlock([
          ...writeTypes(importer)(route),
          FilePrinter.enter(),
          writePath(project)(importer)(route),
        ]),
        ts.NodeFlags.Namespace,
      );

  const writeTypes =
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.TypeAliasDeclaration[] => {
      const output: ts.TypeAliasDeclaration[] = [];
      const declare = (name: string, type: ts.TypeNode) =>
        output.push(
          ts.factory.createTypeAliasDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            name,
            undefined,
            type,
          ),
        );

      declare(
        "Output",
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            "connector",
            undefined,
            ts.factory.createTypeReferenceNode(
              importer.external({
                type: false,
                library: "tgrid",
                instance: "WebConnector",
              }),
              [
                ts.factory.createTypeReferenceNode("Header"),
                ts.factory.createTypeReferenceNode("Provider"),
                ts.factory.createTypeReferenceNode("Remote"),
              ],
            ),
          ),
          ts.factory.createPropertySignature(
            undefined,
            "driver",
            undefined,
            ts.factory.createTypeReferenceNode(
              importer.external({
                type: true,
                library: "tgrid",
                instance: "Driver",
              }),
              [ts.factory.createTypeReferenceNode("Remote")],
            ),
          ),
        ]),
      );

      const acceptor: ITypedWebSocketRoute.IAcceptorParameter =
        route.parameters.find(
          (x) => x.category === "acceptor",
        ) as ITypedWebSocketRoute.IAcceptorParameter;
      const query = route.parameters.find((x) => x.category === "query") as
        | ITypedWebSocketRoute.IQueryParameter
        | undefined;

      declare(
        "Header",
        ts.factory.createTypeReferenceNode(
          (
            (route.parameters.find((x) => x.category === "header") as
              | ITypedWebSocketRoute.IHeaderParameter
              | undefined) ?? acceptor.header
          ).typeName,
        ),
      );
      declare(
        "Provider",
        ts.factory.createTypeReferenceNode(
          (
            (route.parameters.find((x) => x.category === "driver") as
              | ITypedWebSocketRoute.IDriverParameter
              | undefined) ?? acceptor.remote
          ).typeName,
        ),
      );
      declare(
        "Remote",
        ts.factory.createTypeReferenceNode(acceptor.provider.typeName),
      );
      if (query)
        declare("Query", ts.factory.createTypeReferenceNode(query.typeName));
      return output;
    };

  const writePath =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedWebSocketRoute): ts.VariableStatement => {
      const pathParams: ITypedWebSocketRoute.IPathParameter[] =
        route.parameters.filter(
          (p) => p.category === "path",
        ) as ITypedWebSocketRoute.IPathParameter[];
      const query: ITypedWebSocketRoute.IQueryParameter | undefined =
        route.parameters.find((p) => p.category === "query") as
          | ITypedWebSocketRoute.IQueryParameter
          | undefined;
      const total: Array<
        | ITypedWebSocketRoute.IPathParameter
        | ITypedWebSocketRoute.IQueryParameter
      > = [...pathParams, ...(query ? [query] : [])];
      const out = (body: ts.ConciseBody) =>
        constant("path")(
          ts.factory.createArrowFunction(
            [],
            [],
            total.map((p) =>
              IdentifierFactory.parameter(
                p.name,
                p === query
                  ? ts.factory.createTypeReferenceNode(`${route.name}.Query`)
                  : getType(project)(importer)(p),
              ),
            ),
            undefined,
            undefined,
            body,
          ),
        );
      if (total.length === 0)
        return out(ts.factory.createStringLiteral(route.path));

      const template = () => {
        const splitted: string[] = route.path.split(":");
        if (splitted.length === 1)
          return ts.factory.createStringLiteral(route.path);
        return ts.factory.createTemplateExpression(
          ts.factory.createTemplateHead(splitted[0]),
          splitted.slice(1).map((s, i, arr) => {
            const name: string = s.split("/")[0];
            return ts.factory.createTemplateSpan(
              ts.factory.createCallExpression(
                ts.factory.createIdentifier("encodeURIComponent"),
                undefined,
                [
                  ts.factory.createBinaryExpression(
                    ts.factory.createIdentifier(
                      pathParams.find((p) => p.field === name)!.name,
                    ),
                    ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                    ts.factory.createStringLiteral("null"),
                  ),
                ],
              ),
              (i !== arr.length - 1
                ? ts.factory.createTemplateMiddle
                : ts.factory.createTemplateTail)(s.substring(name.length)),
            );
          }),
        );
      };
      if (query === undefined) return out(template());

      const block = (expr: ts.Expression) => {
        const computeName = (str: string): string =>
          total.find((p) => p.name === str) !== undefined
            ? computeName("_" + str)
            : str;
        const variables: string = computeName("variables");
        return ts.factory.createBlock(
          [
            local(variables)("URLSearchParams")(
              ts.factory.createNewExpression(
                ts.factory.createIdentifier("URLSearchParams"),
                [],
                [],
              ),
            ),
            ts.factory.createForOfStatement(
              undefined,
              ts.factory.createVariableDeclarationList(
                [
                  ts.factory.createVariableDeclaration(
                    ts.factory.createArrayBindingPattern([
                      ts.factory.createBindingElement(
                        undefined,
                        undefined,
                        ts.factory.createIdentifier("key"),
                        undefined,
                      ),
                      ts.factory.createBindingElement(
                        undefined,
                        undefined,
                        ts.factory.createIdentifier("value"),
                        undefined,
                      ),
                    ]),
                    undefined,
                    undefined,
                    undefined,
                  ),
                ],
                ts.NodeFlags.Const,
              ),
              ts.factory.createCallExpression(
                ts.factory.createIdentifier("Object.entries"),
                undefined,
                [
                  ts.factory.createAsExpression(
                    expr,
                    TypeFactory.keyword("any"),
                  ),
                ],
              ),
              ts.factory.createIfStatement(
                ts.factory.createStrictEquality(
                  ts.factory.createIdentifier("undefined"),
                  ts.factory.createIdentifier("value"),
                ),
                ts.factory.createContinueStatement(),
                ts.factory.createIfStatement(
                  ts.factory.createCallExpression(
                    ts.factory.createIdentifier("Array.isArray"),
                    undefined,
                    [ts.factory.createIdentifier("value")],
                  ),
                  ts.factory.createExpressionStatement(
                    ts.factory.createCallExpression(
                      ts.factory.createPropertyAccessExpression(
                        ts.factory.createIdentifier("value"),
                        ts.factory.createIdentifier("forEach"),
                      ),
                      undefined,
                      [
                        ts.factory.createArrowFunction(
                          undefined,
                          undefined,
                          [IdentifierFactory.parameter("elem")],
                          undefined,
                          undefined,
                          ts.factory.createCallExpression(
                            IdentifierFactory.access(
                              ts.factory.createIdentifier(variables),
                            )("append"),
                            undefined,
                            [
                              ts.factory.createIdentifier("key"),
                              ts.factory.createCallExpression(
                                ts.factory.createIdentifier("String"),
                                undefined,
                                [ts.factory.createIdentifier("elem")],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  ts.factory.createExpressionStatement(
                    ts.factory.createCallExpression(
                      IdentifierFactory.access(
                        ts.factory.createIdentifier(variables),
                      )("set"),
                      undefined,
                      [
                        ts.factory.createIdentifier("key"),
                        ts.factory.createCallExpression(
                          ts.factory.createIdentifier("String"),
                          undefined,
                          [ts.factory.createIdentifier("value")],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            local("location")("string")(template()),
            ts.factory.createReturnStatement(
              ts.factory.createConditionalExpression(
                ts.factory.createStrictEquality(
                  ExpressionFactory.number(0),
                  IdentifierFactory.access(
                    ts.factory.createIdentifier(variables),
                  )("size"),
                ),
                undefined,
                ts.factory.createIdentifier("location"),
                undefined,
                ts.factory.createTemplateExpression(
                  ts.factory.createTemplateHead(""),
                  [
                    ts.factory.createTemplateSpan(
                      ts.factory.createIdentifier("location"),
                      ts.factory.createTemplateMiddle("?"),
                    ),
                    ts.factory.createTemplateSpan(
                      ts.factory.createCallExpression(
                        IdentifierFactory.access(
                          ts.factory.createIdentifier(variables),
                        )("toString"),
                        undefined,
                        undefined,
                      ),
                      ts.factory.createTemplateTail(""),
                    ),
                  ],
                ),
              ),
            ),
          ],
          true,
        );
      };
      return out(block(ts.factory.createIdentifier(query.name)));
    };
}

const local = (name: string) => (type: string) => (expression: ts.Expression) =>
  ts.factory.createVariableStatement(
    [],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          name,
          undefined,
          ts.factory.createTypeReferenceNode(type),
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
const constant = (name: string) => (expression: ts.Expression) =>
  ts.factory.createVariableStatement(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          name,
          undefined,
          undefined,
          expression,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
const getType =
  (project: INestiaProject) =>
  (importer: ImportDictionary) =>
  (
    p:
      | ITypedWebSocketRoute.IPathParameter
      | ITypedWebSocketRoute.IQueryParameter,
  ) =>
    p.metadata
      ? SdkTypeProgrammer.write(project)(importer)(p.metadata)
      : ts.factory.createTypeReferenceNode(p.typeName);
