import { AesPkcs5, IEncryptionPassword } from "@nestia/fetcher";
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
import { Observable, catchError, map } from "rxjs";

import {
    assertStringify,
    isStringify,
    stringify,
    validateStringify,
} from "typia";

import { IResponseBodyStringifier } from "../options/IResponseBodyStringifier";
import { Singleton } from "../utils/Singleton";
import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";
import { TransformError } from "./internal/TransformError";
import { get_path_and_stringify } from "./internal/get_path_and_stringify";
import { headers_to_object } from "./internal/headers_to_object";
import { route_error } from "./internal/route_error";

/**
 * Encrypted router decorator functions.
 *
 * `EncryptedRoute` is a module containing router decorator functions which encrypts
 * response body data through AES-128/256 encryption. Furthermore, they can boost
 * up JSON string conversion speed about 50x times faster than `class-transformer`,
 * even type safe through [typia](https://github.com/samchon/typia).
 *
 * For reference, router functions of `EncryptedRoute` can convert custom error classes
 * to regular {@link nest.HttpException} class automatically, through
 * {@link ExceptionManager}. Also, `EncryptedRoute` encrypts response body using those
 * options.
 *
 *  - AES-128/256
 *  - CBC mode
 *  - PKCS #5 Padding
 *  - Base64 Encoding
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export namespace EncryptedRoute {
    /**
     * Encrypted router decorator function for the GET method.
     *
     * @param paths Path(s) of the HTTP request
     * @returns Method decorator
     */
    export const Get = Generator("Get");

    /**
     * Encrypted router decorator function for the GET method.
     *
     * @param paths Path(s) of the HTTP request
     * @returns Method decorator
     */
    export const Post = Generator("Post");

    /**
     * Encrypted router decorator function for the PATCH method.
     *
     * @param path Path of the HTTP request
     * @returns Method decorator
     */
    export const Patch = Generator("Patch");

    /**
     * Encrypted router decorator function for the PUT method.
     *
     * @param path Path of the HTTP request
     * @returns Method decorator
     */
    export const Put = Generator("Put");

    /**
     * Encrypted router decorator function for the DELETE method.
     *
     * @param path Path of the HTTP request
     * @returns Method decorator
     */
    export const Delete = Generator("Delete");

    function Generator(method: "Get" | "Post" | "Put" | "Patch" | "Delete") {
        function route(path?: string | string[]): MethodDecorator;
        function route<T>(
            stringify?: IResponseBodyStringifier<T> | null,
        ): MethodDecorator;
        function route<T>(
            path: string | string[],
            stringify?: IResponseBodyStringifier<T> | null,
        ): MethodDecorator;

        function route(...args: any[]): MethodDecorator {
            const [path, stringify] = get_path_and_stringify(
                `EncryptedRoute.${method}`,
            )(...args);
            return applyDecorators(
                ROUTERS[method](path),
                UseInterceptors(
                    new EncryptedRouteInterceptor(method, stringify),
                ),
            );
        }
        return route;
    }
}

for (const method of [
    isStringify,
    assertStringify,
    validateStringify,
    stringify,
])
    for (const [key, value] of Object.entries(method))
        for (const deco of [
            EncryptedRoute.Get,
            EncryptedRoute.Delete,
            EncryptedRoute.Post,
            EncryptedRoute.Put,
            EncryptedRoute.Patch,
        ])
            (deco as any)[key] = value;

/**
 * @internal
 */
class EncryptedRouteInterceptor implements NestInterceptor {
    public constructor(
        private readonly method: string,
        private readonly stringify: (input: any) => string,
    ) {}

    public intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<any> {
        const http: HttpArgumentsHost = context.switchToHttp();
        return next.handle().pipe(
            map((value) => {
                const param:
                    | IEncryptionPassword
                    | IEncryptionPassword.Closure
                    | undefined = Reflect.getMetadata(
                    ENCRYPTION_METADATA_KEY,
                    context.getClass(),
                );
                if (!param)
                    throw TransformError(`EncryptedRoute.${this.method}`);

                const headers: Singleton<Record<string, string>> =
                    new Singleton(() => {
                        const request: express.Request = http.getRequest();
                        return headers_to_object(request.headers);
                    });
                const body: string | undefined = this.stringify(value);
                const password: IEncryptionPassword =
                    typeof param === "function"
                        ? param({ headers: headers.get(), body }, false)
                        : param;
                const disabled: boolean =
                    password.disabled === undefined
                        ? false
                        : typeof password.disabled === "function"
                        ? password.disabled(
                              { headers: headers.get(), body },
                              false,
                          )
                        : password.disabled;

                const response: express.Response = http.getResponse();
                response.header(
                    "Content-Type",
                    disabled ? "application/json" : "text/plain",
                );

                if (disabled === true) return body;
                else if (body === undefined) return body;
                return AesPkcs5.encrypt(body, password.key, password.iv);
            }),
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
    Put,
    Patch,
    Delete,
};
