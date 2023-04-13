import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import express from "express";

import { assert } from "typia";

import { TransformError } from "./internal/TransformError";

/**
 * Type safe URL query decorator.
 *
 * `TypedQuery` is a decorator function that can parse URL query string. It is almost
 * same with {@link nest.Query}, but it can automatically cast property type following
 * its DTO definition. Also, `TypedQuery` performs type validation.
 *
 * For referecen, when URL query parameters are different with their promised
 * type `T`, `BadRequestException` error (status code: 400) would be thrown.
 *
 * @returns Parameter decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedQuery<T>(
    decoder?: (params: URLSearchParams) => T,
): ParameterDecorator {
    if (decoder === undefined) throw TransformError("TypedQuery");

    return createParamDecorator(async function TypedQuery(
        _unknown: any,
        ctx: ExecutionContext,
    ) {
        const request: express.Request = ctx.switchToHttp().getRequest();
        const params: URLSearchParams = new URLSearchParams(tail(request.url));
        return decoder(params);
    })();
}

/**
 * @internal
 */
export namespace TypedQuery {
    export function boolean(
        str: string | null | undefined,
    ): boolean | undefined {
        return str?.length ? Boolean(str) : undefined;
    }
    export function number(str: string | null | undefined): number | undefined {
        return str?.length ? Number(str) : undefined;
    }
    export function bigint(str: string | null | undefined): bigint | undefined {
        return str?.length ? BigInt(str) : undefined;
    }
    export function string(str: string | null | undefined): string | undefined {
        return str !== undefined && str !== null ? str : undefined;
    }
}
Object.assign(TypedQuery, assert);

/**
 * @internal
 */
function tail(url: string): string {
    const index: number = url.indexOf("?");
    return index === -1 ? "" : url.substring(index + 1);
}
