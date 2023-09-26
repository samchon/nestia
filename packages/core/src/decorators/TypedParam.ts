import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import typia, { TypeGuardError } from "typia";

import { NoTransformConfigureError } from "./internal/NoTransformConfigureError";

/**
 * Type safe URL parameter decorator.
 *
 * `TypedParam` is a decorator function getting specific typed parameter from the
 * HTTP request URL. It's almost same with the {@link nest.Param}, but `TypedParam`
 * automatically casts parameter value to be following its type, and validates it.
 *
 * ```typescript
 * import { tags } from "typia";
 *
 * \@TypedRoute.Get("shopping/sales/:id/:no/:paused")
 * public async pause
 *     (
 *         \@TypedParam("id", "uuid"), id: string & tags.Format<"uuid">,
 *         \@TypedParam("no") id: number & tags.Type<"uint32">
 *         \@TypedParam("paused") paused: boolean | null
 *     ): Promise<void>;
 * ```
 *
 * @param name URL Parameter name
 * @returns Parameter decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedParam<T extends boolean | bigint | number | string | null>(
    name: string,
    assert?: (value: string) => T,
): ParameterDecorator {
    if (assert === undefined) throw NoTransformConfigureError("TypedParam");

    return createParamDecorator(function TypedParam(
        {}: any,
        context: ExecutionContext,
    ) {
        const request: express.Request | FastifyRequest = context
            .switchToHttp()
            .getRequest();
        const str: string = (request.params as any)[name];
        try {
            return assert(str);
        } catch (exp) {
            if (typia.is<TypeGuardError>(exp))
                throw new BadRequestException({
                    path: exp.path,
                    reason: exp.message,
                    expected: exp.expected,
                    value: exp.value,
                    message: `Invalid URL parameter value on "${name}".`,
                });
            throw exp;
        }
    })(name);
}
Object.assign(TypedParam, typia.http.parameter);
