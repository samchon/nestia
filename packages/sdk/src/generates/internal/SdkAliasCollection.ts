import ts from "typescript";
import typia from "typia";

import { INestiaProject } from "../../structures/INestiaProject";
import { IReflectHttpOperationParameter } from "../../structures/IReflectHttpOperationParameter";
import { IReflectType } from "../../structures/IReflectType";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { ImportDictionary } from "./ImportDictionary";

export namespace SdkAliasCollection {
  export const name = (type: IReflectType): ts.TypeNode =>
    ts.factory.createTypeReferenceNode(
      type.name,
      type.typeArguments ? type.typeArguments.map(name) : undefined,
    );

  export const headers =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IHeaders): ts.TypeNode => {
      const type: ts.TypeNode = name(param);
      if (project.config.primitive === false) return type;
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
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IQuery): ts.TypeNode => {
      const type: ts.TypeNode = name(param);
      if (project.config.primitive === false) return type;
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
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(param);
      if (project.config.clone === true || project.config.primitive === false)
        return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "@nestia/fetcher",
          instance:
            typia.is<IReflectHttpOperationParameter.IBody>(param) &&
            (param.contentType === "application/json" ||
              param.encrypted === true)
              ? "Primitive"
              : "Resolved",
        }),
        [type],
      );
    };

  export const output =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.TypeNode => {
      if (project.config.propagate !== true) {
        if (project.config.clone === true || project.config.primitive === false)
          return name(route.success.type);
        return ts.factory.createTypeReferenceNode(
          importer.external({
            type: true,
            library: "@nestia/fetcher",
            instance:
              route.success.contentType === "application/json" ||
              route.success.encrypted === true
                ? "Primitive"
                : "Resolved",
          }),
          [name(route.success.type)],
        );
      }

      const branches: IBranch[] = [
        {
          status: String(
            route.success.status ?? (route.method === "POST" ? 201 : 200),
          ),
          type: name(route.success.type),
        },
        ...Object.entries(route.exceptions).map(([status, value]) => ({
          status,
          type: name(value.type),
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
          ...(route.success.status
            ? [
                ts.factory.createLiteralTypeNode(
                  ts.factory.createNumericLiteral(route.success.status),
                ),
              ]
            : []),
        ],
      );
    };

  export const responseBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.TypeNode =>
      output({
        ...project,
        config: {
          ...project.config,
          propagate: false,
        },
      })(importer)(route);
}

interface IBranch {
  status: string;
  type: ts.TypeNode;
}
