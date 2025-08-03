import {
  CallHandler,
  Delete,
  ExecutionContext,
  Get,
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
 * `TypedRoute` is a module containing router decorator functions which can boost up
 * JSON string conversion speed about 200x times faster than `class-transformer`.
 * Furthermore, such JSON string conversion is even type safe through
 * [typia](https://github.com/samchon/typia).
 *
 * For reference, if you try to invalid data that is not following the promised
 * type `T`, 500 internal server error would be thrown. Also, as `TypedRoute` composes
 * JSON string through `typia.assertStringify<T>()` function, it is not possible to
 * modify response data through interceptors.
 *
 * @author Jeongho Nam - https://github.com/samchon
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
   * If you've configured the transformation option to `validate.log`
   * in the `tsconfig.json` file, then the error log information of the
   * response validation failure would be logged through this function
   * instead of throwing the 400 bad request error.
   *
   * By the way, be careful. If you've configured the response
   * transformation option to be `validate.log`, client may get wrong
   * response data. Therefore, this way is not recommended in the common
   * backend server case.
   *
   * @param func Logger function
   * @default console.log
   */
  export function setValidateErrorLogger(
    func: (log: IValidateErrorLog) => void,
  ): void {
    __logger = func;
  }

  /**
   * Error log information of the response validation failure.
   *
   * `IValidationErrorLog` is a structure representing the error log
   * information when the returned value from the `@TypedRoute` or
   * `@EncryptedRoute` decorated controller method is not following
   * the promised type `T`.
   *
   * If you've configured the transformation option to `validate.log` or
   * `validateEquals.log` in the `tsconfig.json` file, then this error log
   * information `IValidateErrorLog` would be logged through the
   * {@link setValidateErrorLogger} function instead of throwing the
   * 400 bad request error.
   */
  export interface IValidateErrorLog {
    /**
     * HTTP method of the request.
     */
    method: string;

    /**
     * HTTP path of the request.
     */
    path: string;

    /**
     * Validation error information with detailed reasons.
     */
    errors: IValidation.IError[];

    /**
     * Data that is not following the promised type `T`.
     */
    data: unknown;
  }

  /**
   * @internal
   */
  export let __logger: (log: IValidateErrorLog) => void = console.log;

  /**
   * @internal
   */
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

/**
 * @internal
 */
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

/**
 * @internal
 */
const ROUTERS = {
  Get,
  Post,
  Patch,
  Put,
  Delete,
};
