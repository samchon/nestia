import ts from "typescript";
import typia from "typia";

import { INestiaProject } from "../../structures/INestiaProject";
import { IReflectHttpOperation } from "../../structures/IReflectHttpOperation";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ImportDictionary } from "./ImportDictionary";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkAliasCollection {
  export const name =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (p: ITypedHttpRoute.IParameter | ITypedHttpRoute.IOutput): ts.TypeNode =>
      p.metadata
        ? SdkTypeProgrammer.write(project)(importer)(p.metadata)
        : ts.factory.createTypeReferenceNode(p.typeName);

  export const headers =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRoute.IParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(project)(importer)(param);
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
    (param: ITypedHttpRoute.IParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(project)(importer)(param);
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
    (param: ITypedHttpRoute.IParameter): ts.TypeNode => {
      const type: ts.TypeNode = name(project)(importer)(param);
      if (project.config.clone === true || project.config.primitive === false)
        return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "@nestia/fetcher",
          instance:
            typia.is<IReflectHttpOperation.IBodyParameter>(param) &&
            param.contentType === "multipart/form-data"
              ? "Resolved"
              : "Primitive",
        }),
        [type],
      );
    };

  export const output =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.TypeNode => {
      if (project.config.propagate !== true) {
        const node: ts.TypeNode = name(project)(importer)(route.output);
        const type = project.checker.getTypeAtLocation(node);
        const filter = (flag: ts.TypeFlags) => (type.flags & flag) !== 0;

        if (
          project.config.clone === true ||
          project.config.primitive === false ||
          filter(ts.TypeFlags.Undefined) ||
          filter(ts.TypeFlags.Never) ||
          filter(ts.TypeFlags.Void) ||
          filter(ts.TypeFlags.VoidLike)
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
          type: name(project)(importer)(route.output),
        },
        ...Object.entries(route.exceptions).map(([status, value]) => ({
          status,
          type: name(project)(importer)(value),
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
