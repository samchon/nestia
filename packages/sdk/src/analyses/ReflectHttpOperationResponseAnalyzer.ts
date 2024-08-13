import { SwaggerExample } from "@nestia/core";
import {
  HEADERS_METADATA,
  HTTP_CODE_METADATA,
  INTERCEPTORS_METADATA,
} from "@nestjs/common/constants";
import typia from "typia";
import { JsonMetadataFactory } from "typia/lib/factories/JsonMetadataFactory";
import { HttpQueryProgrammer } from "typia/lib/programmers/http/HttpQueryProgrammer";

import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationSuccess } from "../structures/IReflectHttpOperationSuccess";
import { IReflectOperationError } from "../structures/IReflectOperationError";
import { IOperationMetadata } from "../transformers/IOperationMetadata";
import { TextPlainValidator } from "../transformers/TextPlainValidator";

export namespace ReflectHttpOperationResponseAnalyzer {
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    errors: IReflectOperationError[];
  }

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
        : Reflect.getMetadata(HEADERS_METADATA, ctx.function)?.find(
            (h: Record<string, string>) =>
              typeof h?.name === "string" &&
              typeof h?.value === "string" &&
              h.name.toLowerCase() === "content-type",
          )?.value ?? (ctx.httpMethod === "HEAD" ? null : "application/json");

    const schema =
      contentType === "application/json"
        ? ctx.metadata.success.primitive
        : ctx.metadata.success.resolved;
    if (schema.success === false) errors.push(...schema.errors);
    if (ctx.httpMethod === "HEAD" && contentType !== null)
      errors.push(`HEAD method must not have a content type.`);
    if (
      typia.is<IReflectHttpOperationSuccess["contentType"]>(contentType) ===
      false
    )
      errors.push(
        `@nestia/sdk does not support ${JSON.stringify(contentType)} content type.`,
      );

    if (errors.length) return report();
    else if (
      ctx.metadata.success.type === null ||
      schema.success === false ||
      !typia.is<IReflectHttpOperationSuccess["contentType"]>(contentType)
    )
      return null;

    const example: SwaggerExample.IData<any> | undefined = Reflect.getMetadata(
      "nestia/SwaggerExample/Response",
      ctx.function,
    );
    return {
      contentType: contentType,
      encrypted,
      status:
        getStatus(ctx.function) ?? (ctx.httpMethod === "POST" ? 201 : 200),
      type: ctx.metadata.success.type,
      ...schema.data,
      validate:
        contentType === "application/json" || encrypted === true
          ? JsonMetadataFactory.validate
          : contentType === "application/x-www-form-urlencoded"
            ? HttpQueryProgrammer.validate
            : contentType === "text/plain"
              ? TextPlainValidator.validate
              : (meta) =>
                  meta.size()
                    ? ["HEAD method must not have any return value."]
                    : [],
      example: example?.example,
      examples: example?.examples,
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
}
