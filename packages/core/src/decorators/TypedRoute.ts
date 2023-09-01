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
import express from "express";
import { catchError, map } from "rxjs/operators";

import typia from "typia";

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
     * @internal
     */
    function Generator(method: "Get" | "Post" | "Put" | "Patch" | "Delete") {
        function route(path?: string | string[]): MethodDecorator;
        function route<T>(
            stringify?: IResponseBodyStringifier<T>,
        ): MethodDecorator;
        function route<T>(
            path: string | string[],
            stringify?: IResponseBodyStringifier<T>,
        ): MethodDecorator;

        function route(...args: any[]): MethodDecorator {
            const [path, stringify] = get_path_and_stringify(
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
    public constructor(private readonly stringify: (input: any) => string) {}

    public intercept(context: ExecutionContext, next: CallHandler) {
        const http: HttpArgumentsHost = context.switchToHttp();
        const response: express.Response = http.getResponse();
        response.header("Content-Type", "application/json");

        return next.handle().pipe(
            map((value) => this.stringify(value)),
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
