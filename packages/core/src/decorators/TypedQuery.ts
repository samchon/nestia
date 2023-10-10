import {
    BadRequestException,
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
    createParamDecorator,
} from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";
import type express from "express";
import type { FastifyRequest } from "fastify";
import { catchError, map } from "rxjs";

import typia from "typia";

import { IRequestQueryValidator } from "../options/IRequestQueryValidator";
import { IResponseBodyQuerifier } from "../options/IResponseBodyQuerifier";
import { get_path_and_querify } from "./internal/get_path_and_querify";
import { route_error } from "./internal/route_error";
import { validate_request_query } from "./internal/validate_request_query";

/**
 * Type safe URL query decorator.
 *
 * `TypedQuery` is a decorator function that can parse URL query string. It is almost
 * same with {@link nest.Query}, but it can automatically cast property type following
 * its DTO definition. Also, `TypedQuery` performs type validation.
 *
 * For reference, target type `T` must follw such restriction. Also, if actual URL
 * query parameter values are different with their promised type `T`,
 * `BadRequestException` error (status code: 400) would be thrown.
 *
 * 1. Type `T` must be an object type
 * 2. Do not allow dynamic property
 * 3. Only `boolean`, `bigint`, `number`, `string` or their array types are allowed
 * 4. By the way, union type never be not allowed
 *
 * @returns Parameter decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedQuery<T extends object>(
    validator?: IRequestQueryValidator<T>,
): ParameterDecorator {
    const checker = validate_request_query(validator);
    return createParamDecorator(function TypedQuery(
        _unknown: any,
        context: ExecutionContext,
    ) {
        const request: express.Request | FastifyRequest = context
            .switchToHttp()
            .getRequest();
        const params: URLSearchParams = new URLSearchParams(tail(request.url));

        const output: T | Error = checker(params);
        if (output instanceof Error) throw output;
        return output;
    })();
}
export namespace TypedQuery {
    export function Body<T extends object>(
        validator?: IRequestQueryValidator<T>,
    ): ParameterDecorator {
        const checker = validate_request_query(validator);
        return createParamDecorator(function TypedQueryBody(
            _unknown: any,
            context: ExecutionContext,
        ) {
            const request: express.Request | FastifyRequest = context
                .switchToHttp()
                .getRequest();
            if (isApplicationQuery(request.headers["content-type"]) === false)
                throw new BadRequestException(
                    `Request body type is not "application/x-www-form-urlencoded".`,
                );
            const params: URLSearchParams =
                request.body instanceof URLSearchParams
                    ? request.body
                    : (new FakeURLSearchParams(request.body) as any);

            const output: T | Error = checker(params);
            if (output instanceof Error) throw output;
            return output;
        })();
    }
    Object.assign(Body, typia.http.assertQuery);
    Object.assign(Body, typia.http.isQuery);
    Object.assign(Body, typia.http.validateQuery);

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
            stringify?: IResponseBodyQuerifier<T>,
        ): MethodDecorator;
        function route<T>(
            path: string | string[],
            stringify?: IResponseBodyQuerifier<T>,
        ): MethodDecorator;

        function route(...args: any[]): MethodDecorator {
            const [path, stringify] = get_path_and_querify(
                `TypedQuery.${method}`,
            )(...args);
            return applyDecorators(
                ROUTERS[method](path),
                UseInterceptors(new TypedQueryRouteInterceptor(stringify)),
            );
        }
        return route;
    }
    for (const method of [typia.assert, typia.is, typia.validate])
        for (const [key, value] of Object.entries(method))
            for (const deco of [
                TypedQuery.Get,
                TypedQuery.Delete,
                TypedQuery.Post,
                TypedQuery.Put,
                TypedQuery.Patch,
            ])
                (deco as any)[key] = value;
}
Object.assign(TypedQuery, typia.http.assertQuery);
Object.assign(TypedQuery, typia.http.isQuery);
Object.assign(TypedQuery, typia.http.validateQuery);

/**
 * @internal
 */
function tail(url: string): string {
    const index: number = url.indexOf("?");
    return index === -1 ? "" : url.substring(index + 1);
}

/**
 * @internal
 */
function isApplicationQuery(text?: string): boolean {
    return (
        text !== undefined &&
        text
            .split(";")
            .map((str) => str.trim())
            .some((str) => str === "application/x-www-form-urlencoded")
    );
}

/**
 * @internal
 */
class FakeURLSearchParams {
    public constructor(private readonly target: Record<string, string[]>) {}

    public has(key: string): boolean {
        return this.target[key] !== undefined;
    }

    public get(key: string): string | null {
        const value = this.target[key];
        return value === undefined
            ? null
            : Array.isArray(value)
            ? value[0] ?? null
            : value;
    }

    public getAll(key: string): string[] {
        const value = this.target[key];
        return value === undefined
            ? []
            : Array.isArray(value)
            ? value
            : [value];
    }
}

/**
 * @internal
 */
class TypedQueryRouteInterceptor implements NestInterceptor {
    public constructor(
        private readonly toSearchParams: (input: any) => URLSearchParams,
    ) {}

    public intercept(context: ExecutionContext, next: CallHandler) {
        const http: HttpArgumentsHost = context.switchToHttp();
        const response: express.Response = http.getResponse();
        response.header("Content-Type", "application/x-www-form-urlencoded");

        return next.handle().pipe(
            map((value) => this.toSearchParams(value).toString()),
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
