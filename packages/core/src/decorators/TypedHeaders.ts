import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import typia, { TypeGuardError, assert } from "typia";

import { NoTransformConfigureError } from "./internal/NoTransformConfigureError";

/**
 * Type safe HTTP headers decorator.
 *
 * `TypedHeaders` is a decorator function that can parse HTTP headers. It is almost
 * same with {@link nest.Headers}, but it can automatically cast property type following
 * its DTO definition. Also, `TypedHeaders` performs type validation.
 *
 * For reference, target type `T` must follow such restrictions. Also, if actual HTTP
 * header values are different with their promised type `T`, `BadRequestException`
 * error (status code: 400) would be thrown.
 *
 * 1. Type `T` must be an object type
 * 2. Do not allow dynamic property
 * 3. Property key must be lower case
 * 4. Property value cannot be `null`, but `undefined` is possible
 * 5. Only `boolean`, `bigint`, `number`, `string` or their array types are allowed
 * 6. By the way, union type never be not allowed
 * 7. Property `set-cookie` must be array type
 * 8. Those properties cannot be array type
 *   - age
 *   - authorization
 *   - content-length
 *   - content-type
 *   - etag
 *   - expires
 *   - from
 *   - host
 *   - if-modified-since
 *   - if-unmodified-since
 *   - last-modified
 *   - location
 *   - max-forwards
 *   - proxy-authorization
 *   - referer
 *   - retry-after
 *   - server
 *   - user-agent
 *
 * @returns Parameter decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedHeaders<T extends object>(
    decoder?: (headers: Record<string, string | string[] | undefined>) => T,
): ParameterDecorator {
    if (decoder === undefined) throw NoTransformConfigureError("TypedHeaders");

    return createParamDecorator(function TypedHeaders(
        _unknown: any,
        context: ExecutionContext,
    ) {
        const request: express.Request | FastifyRequest = context
            .switchToHttp()
            .getRequest();
        try {
            return decoder(request.headers);
        } catch (exp) {
            if (typia.is<TypeGuardError>(exp))
                throw new BadRequestException({
                    path: exp.path,
                    reason: exp.message,
                    expected: exp.expected,
                    value: exp.value,
                    message:
                        "Request query parameters are not following the promised type.",
                });
            throw exp;
        }
    })();
}

/**
 * @internal
 */
export namespace TypedHeaders {
    export const boolean = (value: string | undefined) =>
        value !== undefined ? value === "true" : undefined;
    export const bigint = (value: string | undefined) =>
        value !== undefined ? BigInt(value) : undefined;
    export const number = (value: string | undefined) =>
        value !== undefined ? Number(value) : undefined;
    export const string = (value: string | undefined) => value;
}
Object.assign(TypedHeaders, assert);
