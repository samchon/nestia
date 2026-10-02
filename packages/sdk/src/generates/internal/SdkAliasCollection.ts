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
import type { SdkWebSocketParameterProgrammer } from "./SdkWebSocketParameterProgrammer";

/**
 * Type nodes of the SDK: the named types of routes, and the request and
 * response aliases.
 *
 * @evidence contracts/common.md#principled-implementation The namespace builds each type as the syntax tree that the printer writes, from the reflected names or from the metadata when `clone` is on.
 * @evidence contracts/common.md#clear-and-simple-design Several small builders.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The builders depend on the project configuration for the choice of source.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace SdkAliasCollection {
  /**
   * Returns the type reference of a reflected type, with its type arguments.
   *
   * @evidence contracts/common.md#principled-implementation The arguments are built recursively.
   * @evidence contracts/common.md#clear-and-simple-design One recursion.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It writes the name as reflected.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.name composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const name = ({ type }: { type: IReflectType }): TypeNode =>
    factory.createTypeReferenceNode(
      type.name,
      type.typeArguments
        ? type.typeArguments.map((a) => name({ type: a }))
        : undefined,
    );

  /**
   * Returns the type of one chunk of a binary response:
   * `Uint8Array<ArrayBufferLike>`.
   *
   * @evidence contracts/common.md#principled-implementation The chunk type of the platform stream is a byte array.
   * @evidence contracts/common.md#clear-and-simple-design One node.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type is fixed.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.binaryChunk composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const binaryChunk = (): TypeNode =>
    factory.createTypeReferenceNode("Uint8Array", [
      factory.createTypeReferenceNode("ArrayBufferLike"),
    ]);

  /**
   * Returns the type of a binary response: `ReadableStream` of its chunks.
   *
   * @evidence contracts/common.md#principled-implementation A binary response is streamed, not read into memory.
   * @evidence contracts/common.md#clear-and-simple-design One node.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The chunk type is shared.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.binaryResponse composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const binaryResponse = (): TypeNode =>
    factory.createTypeReferenceNode("ReadableStream", [binaryChunk()]);

  /**
   * Returns the type node of a metadata.
   *
   * @evidence contracts/common.md#principled-implementation The metadata is written by the type programmer, so the result is the DTO the clone declares.
   * @evidence contracts/common.md#clear-and-simple-design One delegation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It shares the type writer.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.from composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const from =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (metadata: MetadataSchema): TypeNode =>
      SdkTypeProgrammer.write(project)(importer)(metadata) as TypeNode;

  /**
   * Returns the object type of a route's keyword parameters, each with the
   * description of its parameter or its `@param` tag.
   *
   * @evidence contracts/common.md#principled-implementation The entries are the route's path, query, and body parameters, optional where the metadata is, without prefix.
   * @evidence contracts/common.md#clear-and-simple-design One map over the entries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A parameter with a description carries it as a comment.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.httpProps composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Returns the object type of a WebSocket route's keyword parameters: its path
   * parameters, its query, and its provider.
   *
   * @evidence contracts/common.md#principled-implementation The keys are the names decided by the parameter programmer, so the type and the function agree.
   * @evidence contracts/common.md#clear-and-simple-design One literal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The names are shared.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.websocketProps composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const websocketProps = (
    route: ITypedWebSocketRoute,
    names: SdkWebSocketParameterProgrammer.INames,
  ): TypeNode =>
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
              names.query,
              undefined,
              factory.createTypeReferenceNode("Query"),
            ),
          ]
        : []),
      factory.createPropertySignature(
        undefined,
        names.provider,
        undefined,
        factory.createTypeReferenceNode("Provider"),
      ),
    ]);

  /**
   * Returns the type of a route's headers: its reflected name, or the
   * metadata's type under `clone`.
   *
   * @evidence contracts/common.md#principled-implementation The source follows the `clone` setting.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The choice is made on one flag.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.headers composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Returns the type of a route's query: its metadata under `clone`, otherwise
   * its reflected type wrapped in Resolved unless primitive conversion is off.
   *
   * @evidence contracts/common.md#principled-implementation Clone mode uses the resolved metadata graph; source mode uses the declared type with the configured Resolved conversion.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The choice is made on one flag.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.query composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Returns the type of a route's body: a form data input for a multipart body,
   * and otherwise the reflected name or the metadata's type under `clone`.
   *
   * @evidence contracts/common.md#principled-implementation The multipart body is an input of files and fields, not the declared class.
   * @evidence contracts/common.md#clear-and-simple-design One conditional.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The cases are the content types.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.body composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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

  /**
   * Returns the type of a route's output: the success and every exception as a
   * union of `IPropagation` members, or the success body alone when propagation
   * is off.
   *
   * @evidence contracts/common.md#principled-implementation Status keys retain their declared numeric or range spelling for IPropagation to expand. Source success types follow their content type, while declared exceptions use JSON Primitive conversion independently of the success media type; primitive:false preserves declared source types.
   * @evidence contracts/common.md#clear-and-simple-design One function of two branches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The exceptions are the declared ones.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.response composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const response =
    (project: INestiaProject) =>
    (importer: ImportDictionary) =>
    (route: ITypedHttpRoute): TypeNode => {
      const schema = (
        p: {
          metadata: MetadataSchema;
          type: IReflectType;
        },
        json: boolean,
      ): TypeNode =>
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
                    name: json ? "Primitive" : "Resolved",
                  }),
                  [name(p)],
                )
              : name(p);
      const success: TypeNode =
        route.success.binary === true
          ? binaryResponse()
          : schema(
              route.success,
              route.success.contentType === "application/json" ||
                route.success.encrypted === true,
            );
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
          type: schema(value, true),
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
                // a status range like "4XX" is no numeric literal
                /^\d+$/.test(b.status)
                  ? factory.createNumericLiteral(b.status)
                  : factory.createStringLiteral(b.status),
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

  /**
   * Returns the type of the success body: a stream for a binary response, the
   * reflected type for a plain one, and its primitive form for a JSON
   * response.
   *
   * @evidence contracts/common.md#principled-implementation The route's metadata decides between the branches.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The branches are the response kinds.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the declaration produces and its result.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation SdkAliasCollection.responseBody composes SDK syntax, identifiers or import bindings; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
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
