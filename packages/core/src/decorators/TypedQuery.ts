import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import typia from "typia";

import { IRequestQueryValidator } from "../options/IRequestQueryValidator";
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
