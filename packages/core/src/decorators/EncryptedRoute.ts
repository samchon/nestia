import { AesPkcs5 } from "@nestia/fetcher/lib/AesPkcs5";
import { IEncryptionPassword } from "@nestia/fetcher/lib/IEncryptionPassword";
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
import { Singleton } from "../utils/Singleton";
import { ENCRYPTION_METADATA_KEY } from "./internal/EncryptedConstant";
import { NoTransformConfigureError } from "./internal/NoTransformConfigureError";
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
 * For reference, if you try to invalid data that is not following the promised
 * type `T`, 500 internal server error would be thrown. Also, as `EncryptedRoute`
 * composes JSON string through `typia.assertStringify<T>()` function, it is not
 * possible to modify response data through interceptors.
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
    typia.json.isStringify,
    typia.json.assertStringify,
    typia.json.validateStringify,
    typia.json.stringify,
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

    public intercept(context: ExecutionContext, next: CallHandler) {
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
                    throw NoTransformConfigureError(
                        `EncryptedRoute.${this.method}`,
                    );

                const headers: Singleton<Record<string, string>> =
                    new Singleton(() => {
                        const request: express.Request = http.getRequest();
                        return headers_to_object(request.headers);
                    });
                const body: string | undefined = this.stringify(value);
                const password: IEncryptionPassword =
                    typeof param === "function"
                        ? param({
                              headers: headers.get(),
                              body,
                              direction: "encode",
                          })
                        : param;

                const response: express.Response = http.getResponse();
                response.header("Content-Type", "text/plain");

                if (body === undefined) return body;
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
