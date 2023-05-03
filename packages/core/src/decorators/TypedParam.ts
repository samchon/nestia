import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";

/**
 * Type safe URL parameter decorator.
 *
 * `TypedParam` is a decorator function getting specific typed parameter from the
 * HTTP request URL. It's almost same with the {@link nest.Param}, but `TypedParam`
 * automatically casts parameter value to be following its type. Beside, the
 * {@link nest.Param} always parses all of the parameters as `string` type.
 *
 * Note that, if you just omit the `type` and `nullable` parameters, then
 * `TypedParam` automatically determines the `type` and `nullable` values
 * just by analyzing the parameter type. Only when you need to specify them
 * are, you want to use the `uuid` type.
 *
 * ```typescript
 * \@TypedRoute.Get("shopping/sales/:id/:no/:paused")
 * public async pause
 *     (
 *         \@TypedParam("id", "uuid"), id: string, // uuid specification
 *         \@TypedParam("no") id: number, // auto casting
 *         \@TypedParam("paused") paused: boolean | null // auto casting
 *     ): Promise<void>;
 * ```
 *
 * @param name URL Parameter name
 * @param type If omit, automatically determined by the parameter type.
 * @param nullable If omit, automatically determined by the parameter type.
 * @returns Parameter decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedParam(
    name: string,
    type?: "boolean" | "number" | "string" | "uuid",
    nullable?: false | true,
): ParameterDecorator {
    function TypedParam({}: any, ctx: ExecutionContext) {
        const request: express.Request = ctx.switchToHttp().getRequest();
        const str: string = request.params[name];

        if (nullable === true && str === "null") return null;
        else if (type === "boolean") {
            if (str === "true" || str === "1") return true;
            else if (str === "false" || str === "0") return false;
            else
                throw new BadRequestException(
                    `Value of the URL parameter '${name}' is not a boolean.`,
                );
        } else if (type === "number") {
            const value: number = Number(str);
            if (isNaN(value))
                throw new BadRequestException(
                    `Value of the URL parameter "${name}" is not a number.`,
                );
            return value;
        } else if (type === "uuid") {
            if (UUID_PATTERN.test(str) === false)
                throw new BadRequestException(
                    `Value of the URL parameter "${name}" is not a valid UUID.`,
                );
            return str;
        } else return str;
    }
    (TypedParam as any).nullable = !!nullable;
    (TypedParam as any).type = type;
    return createParamDecorator(TypedParam)(name);
}

const UUID_PATTERN =
    /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
