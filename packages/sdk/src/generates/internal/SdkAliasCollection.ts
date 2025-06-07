import ts from "typescript";
import { TypeFactory } from "typia/lib/factories/TypeFactory";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { INestiaProject } from "../../structures/INestiaProject";
import { IReflectType } from "../../structures/IReflectType";
import { ITypedHttpRoute } from "../../structures/ITypedHttpRoute";
import { ITypedHttpRouteParameter } from "../../structures/ITypedHttpRouteParameter";
import { ITypedWebSocketRoute } from "../../structures/ITypedWebSocketRoute";
import { FilePrinter } from "./FilePrinter";
import { ImportDictionary } from "./ImportDictionary";
import { SdkHttpParameterProgrammer } from "./SdkHttpParameterProgrammer";
import { SdkTypeProgrammer } from "./SdkTypeProgrammer";

export namespace SdkAliasCollection {
  export const name = ({ type }: { type: IReflectType }): ts.TypeNode =>
    ts.factory.createTypeReferenceNode(
      type.name,
      type.typeArguments
        ? type.typeArguments.map((a) => name({ type: a }))
        : undefined,
    );

  export const from =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (metadata: Metadata) =>
      SdkTypeProgrammer.write(project)(importer)(metadata);

  export const httpProps =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.TypeNode =>
      ts.factory.createTypeLiteralNode(
        SdkHttpParameterProgrammer.getEntries({
          project,
          importer,
          route,
          body: true,
          prefix: false,
        })
          .map((e) => {
            const signature: ts.PropertySignature =
              ts.factory.createPropertySignature(
                undefined,
                e.key,
                e.required
                  ? undefined
                  : ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                e.type,
              );
            const description: string | null =
              e.parameter.description ??
              route.jsDocTags
                ?.find(
                  (tag) =>
                    tag.name === "param" &&
                    tag.text?.[0]?.kind === "parameterName" &&
                    tag.text?.[0]?.text === e.key,
                )
                ?.text?.find((t) => t.kind === "text")?.text ??
              null;
            return description?.length
              ? [
                  ts.factory.createIdentifier("\n") as any,
                  FilePrinter.description(signature, description),
                ]
              : [signature];
          })
          .flat(),
      );

  export const websocketProps = (route: ITypedWebSocketRoute): ts.TypeNode =>
    ts.factory.createTypeLiteralNode([
      ...route.pathParameters.map((p) =>
        ts.factory.createPropertySignature(
          undefined,
          p.name,
          undefined,
          SdkAliasCollection.name(p),
        ),
      ),
      ...(route.query
        ? [
            ts.factory.createPropertySignature(
              undefined,
              "query",
              undefined,
              ts.factory.createTypeReferenceNode("Query"),
            ),
          ]
        : []),
      ts.factory.createPropertySignature(
        undefined,
        "provider",
        undefined,
        ts.factory.createTypeReferenceNode("Provider"),
      ),
    ]);

  export const headers =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IHeaders): ts.TypeNode => {
      if (project.config.clone === true)
        return from(project)(importer)(param.metadata);
      const type: ts.TypeNode = name(param);
      if (project.config.primitive === false) return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "typia",
          instance: "Resolved",
        }),
        [type],
      );
    };

  export const query =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IQuery): ts.TypeNode => {
      if (project.config.clone === true)
        return from(project)(importer)(param.metadata);
      const type: ts.TypeNode = name(param);
      if (project.config.primitive === false) return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "typia",
          instance: "Resolved",
        }),
        [type],
      );
    };

  export const body =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IBody): ts.TypeNode => {
      if (project.config.clone === true) {
        const type: ts.TypeNode = from(project)(importer)(param.metadata);
        return param.contentType === "multipart/form-data"
          ? formDataInput(importer)(type)
          : type;
      }
      const type: ts.TypeNode = name(param);
      if (param.contentType === "multipart/form-data")
        return formDataInput(importer)(type);
      else if (project.config.primitive === false) return type;
      return ts.factory.createTypeReferenceNode(
        importer.external({
          type: true,
          library: "typia",
          instance:
            param.contentType === "application/json" || param.encrypted === true
              ? "Primitive"
              : "Resolved",
        }),
        [type],
      );
    };

  export const response =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): ts.TypeNode => {
      const schema = (p: { metadata: Metadata; type: IReflectType }) =>
        p.metadata.size() === 0
          ? TypeFactory.keyword("void")
          : project.config.clone === true
            ? from(project)(importer)(p.metadata)
            : project.config.primitive !== false
              ? ts.factory.createTypeReferenceNode(
                  importer.external({
                    type: true,
                    library: "typia",
                    instance:
                      route.success.contentType === "application/json" ||
                      route.success.encrypted === true
                        ? "Primitive"
                        : "Resolved",
                  }),
                  [name(p)],
                )
              : name(p);
      if (project.config.propagate !== true) return schema(route.success);

      const branches: IBranch[] = [
        {
          status: String(
            route.success.status ?? (route.method === "POST" ? 201 : 200),
          ),
          type: schema(route.success),
        },
        ...Object.entries(route.exceptions).map(([status, value]) => ({
          status,
          type: schema(value),
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
      response({
        ...project,
        config: {
          ...project.config,
          propagate: false,
        },
      })(importer)(route);

  const formDataInput = (importer: ImportDictionary) => (type: ts.TypeNode) =>
    ts.factory.createTypeReferenceNode(
      importer.external({
        type: true,
        library: "@nestia/fetcher",
        instance: "FormDataInput",
      }),
      [type],
    );
}

interface IBranch {
  status: string;
  type: ts.TypeNode;
}
