import {
  SyntaxKind,
  type TypeElement,
  type TypeNode,
  factory,
} from "@ttsc/factory";

import { TypeFactory } from "../../factories/TypeFactory";
import { MetadataSchema, sizeOf } from "../../internal/legacy";
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
  export const name = ({ type }: { type: IReflectType }): TypeNode =>
    factory.createTypeReferenceNode(
      type.name,
      type.typeArguments
        ? type.typeArguments.map((a) => name({ type: a }))
        : undefined,
    );

  export const binaryChunk = (): TypeNode =>
    factory.createTypeReferenceNode("Uint8Array", [
      factory.createTypeReferenceNode("ArrayBufferLike"),
    ]);

  export const binaryResponse = (): TypeNode =>
    factory.createTypeReferenceNode("ReadableStream", [binaryChunk()]);

  export const from =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (metadata: MetadataSchema): TypeNode =>
      SdkTypeProgrammer.write(project)(importer)(metadata) as TypeNode;

  export const httpProps =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): TypeNode =>
      factory.createTypeLiteralNode(
        SdkHttpParameterProgrammer.getEntries({
          project,
          importer,
          route,
          body: true,
          prefix: false,
        })
          .map((e) => {
            const signature: TypeElement = factory.createPropertySignature(
              undefined,
              e.key,
              e.required
                ? undefined
                : factory.createToken(SyntaxKind.QuestionToken),
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
                  factory.createIdentifier("\n") as any,
                  FilePrinter.description(signature, description),
                ]
              : [signature];
          })
          .flat(),
      );

  export const websocketProps = (route: ITypedWebSocketRoute): TypeNode =>
    factory.createTypeLiteralNode([
      ...route.pathParameters.map((p) =>
        factory.createPropertySignature(
          undefined,
          p.name,
          undefined,
          SdkAliasCollection.name(p),
        ),
      ),
      ...(route.query
        ? [
            factory.createPropertySignature(
              undefined,
              "query",
              undefined,
              factory.createTypeReferenceNode("Query"),
            ),
          ]
        : []),
      factory.createPropertySignature(
        undefined,
        "provider",
        undefined,
        factory.createTypeReferenceNode("Provider"),
      ),
    ]);

  export const headers =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IHeaders): TypeNode => {
      if (project.config.clone === true)
        return from(project)(importer)(param.metadata);
      const type: TypeNode = name(param);
      if (project.config.primitive === false) return type;
      return factory.createTypeReferenceNode(
        importer.external({
          file: "typia",
          declaration: true,
          type: "element",
          name: "Resolved",
        }),
        [type],
      );
    };

  export const query =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IQuery): TypeNode => {
      if (project.config.clone === true)
        return from(project)(importer)(param.metadata);
      const type: TypeNode = name(param);
      if (project.config.primitive === false) return type;
      return factory.createTypeReferenceNode(
        importer.external({
          file: "typia",
          declaration: true,
          type: "element",
          name: "Resolved",
        }),
        [type],
      );
    };

  export const body =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (param: ITypedHttpRouteParameter.IBody): TypeNode => {
      if (project.config.clone === true) {
        const type: TypeNode = from(project)(importer)(param.metadata);
        return param.contentType === "multipart/form-data"
          ? formDataInput(importer)(type)
          : type;
      }
      const type: TypeNode = name(param);
      if (param.contentType === "multipart/form-data")
        return formDataInput(importer)(type);
      else if (project.config.primitive === false) return type;
      return factory.createTypeReferenceNode(
        importer.external({
          file: "typia",
          declaration: true,
          type: "element",
          name:
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
    (route: ITypedHttpRoute): TypeNode => {
      const schema = (p: {
        metadata: MetadataSchema;
        type: IReflectType;
      }): TypeNode =>
        sizeOf(p.metadata) === 0
          ? TypeFactory.keyword("void")
          : project.config.clone === true
            ? from(project)(importer)(p.metadata)
            : project.config.primitive !== false
              ? factory.createTypeReferenceNode(
                  importer.external({
                    file: "typia",
                    declaration: true,
                    type: "element",
                    name:
                      route.success.contentType === "application/json" ||
                      route.success.encrypted === true
                        ? "Primitive"
                        : "Resolved",
                  }),
                  [name(p)],
                )
              : name(p);
      const success: TypeNode =
        route.success.binary === true
          ? binaryResponse()
          : schema(route.success);
      if (project.config.propagate !== true) return success;

      const branches: IBranch[] = [
        {
          status: String(
            route.success.status ?? (route.method === "POST" ? 201 : 200),
          ),
          type: success,
        },
        ...Object.entries(route.exceptions).map(([status, value]) => ({
          status,
          type: schema(value),
        })),
      ];
      return factory.createTypeReferenceNode(
        importer.external({
          file: "@nestia/fetcher",
          declaration: true,
          type: "element",
          name: "IPropagation",
        }),
        [
          factory.createTypeLiteralNode(
            branches.map((b) =>
              factory.createPropertySignature(
                undefined,
                factory.createNumericLiteral(b.status),
                undefined,
                b.type,
              ),
            ),
          ),
          ...(route.success.status
            ? [
                factory.createLiteralTypeNode(
                  factory.createNumericLiteral(route.success.status),
                ),
              ]
            : []),
        ],
      );
    };

  export const responseBody =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): TypeNode =>
      response({
        ...project,
        config: {
          ...project.config,
          propagate: false,
        },
      })(importer)(route);

  const formDataInput = (importer: ImportDictionary) => (type: TypeNode) =>
    factory.createTypeReferenceNode(
      importer.external({
        file: "@nestia/fetcher",
        declaration: true,
        type: "element",
        name: "FormDataInput",
      }),
      [type],
    );
}

interface IBranch {
  status: string;
  type: TypeNode;
}
