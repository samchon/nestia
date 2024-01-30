import ts from "typescript";

import { INestiaConfig } from "../../INestiaConfig";
import { IRoute } from "../../structures/IRoute";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkAliasCollection {
  export const name =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (p: IRoute.IParameter | IRoute.IOutput): ts.TypeNode =>
      p.metadata
        ? SdkTypeProgrammer.write(config)(importer)(p.metadata)
        : ts.factory.createTypeReferenceNode(p.typeName);

  export const headers =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (param: IRoute.IParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(config)(importer)(param);
      if (config.primitive === false) return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "@nestia/fetcher",
          instance: "Resolved",
        }),
        [type],
      );
    };

  export const query =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (param: IRoute.IParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(config)(importer)(param);
      if (config.primitive === false) return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "@nestia/fetcher",
          instance: "Resolved",
        }),
        [type],
      );
    };

  export const input =
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (param: IRoute.IParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(config)(importer)(param);
      if (config.primitive === false) return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "@nestia/fetcher",
          instance: "Primitive",
        }),
        [type],
      );
    };

  export const output =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (route: IRoute): ts.TypeNode => {
      if (config.propagate !== true) {
        const node: ts.TypeNode = name(config)(importer)(route.output);
        const type = checker.getTypeAtLocation(node);
        const filter = (flag: ts.TypeFlags) => (type.getFlags() & flag) !== 0;

        if (
          filter(ts.TypeFlags.Undefined) ||
          filter(ts.TypeFlags.Never) ||
          filter(ts.TypeFlags.Void) ||
          filter(ts.TypeFlags.VoidLike) ||
          config.primitive === false
        )
          return node;
        return ts.factory.createTypeReferenceNode(
          importer.external({
            type: true,
            library: "@nestia/fetcher",
            instance:
              route.output.contentType === "application/x-www-form-urlencoded"
                ? "Resolved"
                : "Primitive",
          }),
          [node],
        );
      }

      const branches: IBranch[] = [
        {
          status: String(route.status ?? (route.method === "POST" ? 201 : 200)),
          type: name(config)(importer)(route.output),
        },
        ...Object.entries(route.exceptions).map(([status, value]) => ({
          status,
          type: name(config)(importer)(value),
        })),
      ];
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "@nestia/fetcher",
          instance: "IPropagation",
        }),
        [
          ts.factory.createTypeLiteralNode(
            branches.map((b) =>
              ts.factory.createPropertySignature(
                undefined,
                ts.factory.createNumericLiteral(b.status),
                undefined,
                b.type,
              ),
            ),
          ),
          ...(route.status
            ? [
                ts.factory.createLiteralTypeNode(
                  ts.factory.createNumericLiteral(route.status),
                ),
              ]
            : []),
        ],
      );
    };

  export const responseBody =
    (checker: ts.TypeChecker) =>
    (config: INestiaConfig) =>
    (importer: ImportDictionary) =>
    (route: IRoute): ts.TypeNode =>
      output(checker)({ ...config, propagate: false })(importer)(route);
}

interface IBranch {
  status: string;
  type: ts.TypeNode;
}
