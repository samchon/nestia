import {
  CallHandler,
  Delete,
  ExecutionContext,
  Get,
  Header,
  NestInterceptor,
  Patch,
  Post,
  Put,
  UseInterceptors,
  applyDecorators,
} from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import type express from "express";
import { catchError, map } from "rxjs/operators";
import typia, { IValidation } from "typia";

import { IResponseBodyStringifier } from "../options/IResponseBodyStringifier";
import { get_path_and_stringify } from "./internal/get_path_and_stringify";
import { route_error } from "./internal/route_error";

/**
 * Type safe router decorator functions.
 *
 * `TypedRoute` is a module containing router decorator functions which can
 * boost up JSON string conversion speed about 200x times faster than
 * `class-transformer`. Furthermore, such JSON string conversion is even type
 * safe through [typia](https://github.com/samchon/typia).
 *
 * For reference, if you try to invalid data that is not following the promised
 * type `T`, 500 internal server error would be thrown. Also, as `TypedRoute`
 * composes JSON string through `typia.assertStringify<T>()` function, it is not
 * possible to modify response data through interceptors.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @evidence contracts/common.md#principled-implementation Each method decorator combines Nest's router decorator, a JSON content type, and an interceptor that stringifies the returned value with the function the transform selected, so the JSON text is produced by generated code; an error thrown by the handler is routed to the registered exception converters.
 * @evidence contracts/common.md#clear-and-simple-design One generator function creates the five HTTP-method decorators, and the interceptor and the router table are module-private.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The loop after the namespace copies the marker properties of typia's stringify functions onto the decorators for the transform, which mutates only these exported functions; the logger is a module variable, not a patched global.
 * @evidence contracts/common.md#meaningful-documentation The comment documents the decorator family, the path and stringify arguments, and the validation modes.
 */
export namespace TypedRoute {
  /**
   * Router decorator function for the GET method.
   *
   * @param path Path of the HTTP request
   * @returns Method decorator
   */
  export const Get = Generator("Get");

  /**
   * Router decorator function for the POST method.
   *
   * @param path Path of the HTTP request
   * @returns Method decorator
   */
  export const Post = Generator("Post");

  /**
   * Router decorator function for the PATH method.
   *
   * @param path Path of the HTTP request
   * @returns Method decorator
   */
  export const Patch = Generator("Patch");

  /**
   * Router decorator function for the PUT method.
   *
   * @param path Path of the HTTP request
   * @returns Method decorator
   */
  export const Put = Generator("Put");

  /**
   * Router decorator function for the DELETE method.
   *
   * @param path Path of the HTTP request
   * @returns Method decorator
   */
  export const Delete = Generator("Delete");

  /**
   * Set the logger function for the response validation failure.
   *
   * If you've configured the transformation option to `validate.log` in the
   * `tsconfig.json` file, then the error log information of the response
   * validation failure would be logged through this function instead of
   * throwing the 400 bad request error.
   *
   * By the way, be careful. If you've configured the response transformation
   * option to be `validate.log`, client may get wrong response data. Therefore,
   * this way is not recommended in the common backend server case.
   *
   * @default console.log
   * @param func Logger function
   * @evidence contracts/common.md#principled-implementation It replaces the module's logger variable, which the `validate.log` mode calls when a response fails validation, and the default is `console.log`.
   * @evidence contracts/common.md#clear-and-simple-design One assignment.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It changes only the logger variable.
   * @evidence contracts/common.md#meaningful-documentation The comment states which mode uses the logger.
   */
  export function setValidateErrorLogger(
    func: (log: IValidateErrorLog) => void,
  ): void {
    __logger = func;
  }

  /**
   * Error log information of the response validation failure.
   *
   * `IValidationErrorLog` is a structure representing the error log information
   * when the returned value from the `@TypedRoute` or `@EncryptedRoute`
   * decorated controller method is not following the promised type `T`.
   *
   * If you've configured the transformation option to `validate.log` or
   * `validateEquals.log` in the `tsconfig.json` file, then this error log
   * information `IValidateErrorLog` would be logged through the
   * {@link setValidateErrorLogger} function instead of throwing the 400 bad
   * request error.
   *
   * @evidence contracts/common.md#principled-implementation The record carries the method, the path, the validation errors, and the offending data, which is what a logger needs to report a response that failed its type.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation Each member documents its meaning.
   */
  export interface IValidateErrorLog {
    /** HTTP method of the request. */
    method: string;

    /** HTTP path of the request. */
    path: string;

    /** Validation error information with detailed reasons. */
    errors: IValidation.IError[];

    /** Data that is not following the promised type `T`. */
    data: unknown;
  }

  /** @internal */
  export let __logger: (log: IValidateErrorLog) => void = console.log;

  /** @internal */
  function Generator(method: "Get" | "Post" | "Put" | "Patch" | "Delete") {
    function route(path?: string | string[]): MethodDecorator;
    function route<T>(stringify?: IResponseBodyStringifier<T>): MethodDecorator;
    function route<T>(
      path: string | string[],
      stringify?: IResponseBodyStringifier<T>,
    ): MethodDecorator;

    function route(...args: any[]): MethodDecorator {
      const [path, stringify] = get_path_and_stringify(() => __logger)(
        `TypedRoute.${method}`,
      )(...args);
      return applyDecorators(
        ROUTERS[method](path),
        Header("Content-Type", "application/json"),
        UseInterceptors(new TypedRouteInterceptor(stringify)),
      );
    }
    return route;
  }
}
for (const method of [
  typia.json.stringify,
  typia.json.isStringify,
  typia.json.assertStringify,
  typia.json.validateStringify,
])
  for (const [key, value] of Object.entries(method))
    for (const deco of [
      TypedRoute.Get,
      TypedRoute.Delete,
      TypedRoute.Post,
      TypedRoute.Put,
      TypedRoute.Patch,
    ])
      (deco as any)[key] = value;

/** @internal */
class TypedRouteInterceptor implements NestInterceptor {
  public constructor(
    private readonly stringify: (
      input: any,
      method: string,
      path: string,
    ) => string,
  ) {}

  public intercept(context: ExecutionContext, next: CallHandler) {
    const http: HttpArgumentsHost = context.switchToHttp();
    const request: express.Request = http.getRequest();
    const response: express.Response = http.getResponse();
    response.header("Content-Type", "application/json");

    return next.handle().pipe(
      map((value) => this.stringify(value, request.method, request.url)),
      catchError((err) => route_error(http.getRequest(), err)),
    );
  }
}

/** @internal */
const ROUTERS = {
  Get,
  Post,
  Patch,
  Put,
  Delete,
};
