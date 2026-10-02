import { SwaggerExample } from "@nestia/core";
import {
  HEADERS_METADATA,
  HTTP_CODE_METADATA,
  INTERCEPTORS_METADATA,
} from "@nestjs/common/constants";

import { JsonMetadataFactory, sizeOf } from "../internal/legacy";
import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationSuccess } from "../structures/IReflectHttpOperationSuccess";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { HttpResponseContentTypeUtil } from "../utils/HttpResponseContentTypeUtil";
import { TextPlainValidator } from "../validators/TextPlainValidator";
import { SwaggerExampleAnalyzer } from "./SwaggerExampleAnalyzer";

/**
 * Reflects the success response of a route method.
 *
 * @evidence contracts/common.md#principled-implementation The content type comes from the encryption and query interceptors, then the headers metadata, then the produces metadata, then the method default; the status comes from the HTTP code metadata or the method default; binary types skip the schema.
 * @evidence contracts/common.md#clear-and-simple-design One public function with small private helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The order follows how NestJS and nestia decorate a route.
 * @evidence contracts/common.md#meaningful-documentation The comment states its purpose.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectHttpOperationResponseAnalyzer analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
 */
export namespace ReflectHttpOperationResponseAnalyzer {
  /**
   * The input of the response analysis: the controller, the method, its name,
   * the HTTP method, the metadata, and the error list.
   *
   * @evidence contracts/common.md#principled-implementation The record holds what the analysis needs.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes and the meaning of its members.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectHttpOperationResponseAnalyzer.IContext analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    errors: IReflectOperationError[];
  }

  /**
   * Returns the success response of a method, or `null` when it cannot be
   * described; the reasons are pushed to the errors.
   *
   * A HEAD method must have no content type, and an unsupported content type is
   * an error.
   *
   * @evidence contracts/common.md#principled-implementation The schema is the primitive form for JSON and the resolved form for other types, the validator depends on the content type, and the status defaults to 201 for POST and 200 otherwise.
   * @evidence contracts/common.md#clear-and-simple-design One function.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The defaults are NestJS's.
   * @evidence contracts/common.md#meaningful-documentation The comment states the null result and the two errors.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation ReflectHttpOperationResponseAnalyzer.analyze analyzes reflected route metadata; it does not resolve native file identity or launch a process. Source resolution and file emission belong to their filesystem owners.
   */
  export const analyze = (
    ctx: IContext,
  ): IReflectHttpOperationSuccess | null => {
    const errors: Array<string | IOperationMetadata.IError> = [];
    const report = () => {
      ctx.errors.push({
        file: ctx.controller.file,
        class: ctx.controller.class.name,
        function: ctx.functionName,
        from: "return",
        contents: errors,
      });
      return null;
    };

    const encrypted: boolean = hasInterceptor({
      name: "EncryptedRouteInterceptor",
      function: ctx.function,
    });
    const contentType: string | null = encrypted
      ? "text/plain"
      : hasInterceptor({
            name: "TypedQueryRouteInterceptor",
            function: ctx.function,
          })
        ? "application/x-www-form-urlencoded"
        : (Reflect.getMetadata(HEADERS_METADATA, ctx.function)?.find(
            (h: Record<string, string>) =>
              typeof h?.name === "string" &&
              typeof h?.value === "string" &&
              h.name.toLowerCase() === "content-type",
          )?.value ??
          Reflect.getMetadata("swagger/apiProduces", ctx.function)?.[0] ??
          (ctx.httpMethod === "HEAD" ? null : "application/json"));

    const binary: boolean = HttpResponseContentTypeUtil.isBinary(contentType);
    const schema = binary
      ? { success: true as const, data: EMPTY_SCHEMA }
      : contentType === "application/json"
        ? ctx.metadata.success.primitive
        : ctx.metadata.success.resolved;
    if (schema.success === false) errors.push(...schema.errors);
    if (ctx.httpMethod === "HEAD" && contentType !== null)
      errors.push(`HEAD method must not have a content type.`);
    if (HttpResponseContentTypeUtil.isSupported(contentType) === false)
      errors.push(
        `@nestia/sdk does not support ${JSON.stringify(contentType)} content type.`,
      );

    if (errors.length) return report();
    else if (
      (binary === false && ctx.metadata.success.type === null) ||
      schema.success === false ||
      !HttpResponseContentTypeUtil.isSupported(contentType)
    )
      return null;

    const example: SwaggerExample.IData<any> | undefined = Reflect.getMetadata(
      "nestia/SwaggerExample/Response",
      ctx.function,
    );
    return {
      contentType,
      binary,
      encrypted,
      status:
        getStatus(ctx.function) ?? (ctx.httpMethod === "POST" ? 201 : 200),
      type: ctx.metadata.success.type ?? { name: "ReadableStream" },
      ...schema.data,
      validate:
        binary === true
          ? () => []
          : contentType === "application/json" || encrypted === true
            ? JsonMetadataFactory.validate
            : contentType === "application/x-www-form-urlencoded"
              ? // a typed query response, held to typia's query rules by the
                // core transform
                undefined
              : contentType === "text/plain"
                ? TextPlainValidator.validate
                : (next) =>
                    sizeOf(next.metadata) !== 0
                      ? ["HEAD method must not have any return value."]
                      : [],
      example: example?.example,
      examples: SwaggerExampleAnalyzer.examples(example),
    };
  };

  const getStatus = (func: Function): number | null => {
    const text = Reflect.getMetadata(HTTP_CODE_METADATA, func);
    if (text === undefined) return null;
    const value: number = Number(text);
    return isNaN(value) ? null : value;
  };

  const hasInterceptor = (props: {
    name: string;
    function: Function;
  }): boolean => {
    const meta = Reflect.getMetadata(INTERCEPTORS_METADATA, props.function);
    if (Array.isArray(meta) === false) return false;
    return meta.some((elem) => elem?.constructor?.name === props.name);
  };

  const EMPTY_SCHEMA: IOperationMetadata.ISchema = {
    components: {
      aliases: [],
      arrays: [],
      objects: [],
      tuples: [],
    },
    metadata: {
      aliases: [],
      any: false,
      arrays: [],
      atomics: [],
      constants: [],
      escaped: null,
      functions: [],
      maps: [],
      natives: [],
      nullable: false,
      objects: [],
      optional: false,
      required: true,
      rest: null,
      sets: [],
      templates: [],
      tuples: [],
      size: 0,
      name: "void",
      empty: true,
    } as IOperationMetadata.ISchema["metadata"],
  };
}
