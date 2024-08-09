import {
  HEADERS_METADATA,
  HTTP_CODE_METADATA,
  INTERCEPTORS_METADATA,
} from "@nestjs/common/constants";
import typia from "typia";

import { IOperationMetadata } from "../structures/IOperationMetadata";
import { IReflectController } from "../structures/IReflectController";
import { IReflectHttpOperationSuccess } from "../structures/IReflectHttpOperationSuccess";

export namespace ReflectHttpOperationResponseAnalyzer {
  export interface IContext {
    controller: IReflectController;
    function: Function;
    functionName: string;
    httpMethod: string;
    metadata: IOperationMetadata;
    report: (message: string) => void;
    isError: () => boolean;
  }

  export const analyze = (
    ctx: IContext,
  ): IReflectHttpOperationSuccess | null => {
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

    if (
      ctx.metadata.success.type === null ||
      ctx.metadata.success.schema === null
    )
      ctx.report(`Failed to analyze the return type.`);
    if (ctx.httpMethod === "HEAD" && contentType !== null)
      ctx.report(`HEAD method must not have a content type.`);
    if (
      typia.is<IReflectHttpOperationSuccess["contentType"]>(contentType) ===
      false
    )
      ctx.report(
        `@nestia/sdk does not support ${JSON.stringify(contentType)} content type.`,
      );

    if (ctx.isError()) return null;
    else if (
      ctx.metadata.success.type === null ||
      ctx.metadata.success.schema === null ||
      !typia.is<IReflectHttpOperationSuccess["contentType"]>(contentType)
    )
      return null;
    return {
      contentType: contentType,
      encrypted,
      status:
        getStatus(ctx.function) ?? (ctx.httpMethod === "POST" ? 201 : 200),
      type: ctx.metadata.success.type,
      schema: ctx.metadata.success.schema,
      components: ctx.metadata.success.components,
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
