import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";

/**
 * URL parameter decorator with type.
 *
 * `TypedParam` is a decorator function getting specific typed parameter from the HTTP
 * request URL. It's almost same with the {@link nest.Param}, but `TypedParam` can specify
 * the parameter type manually. Beside, the {@link nest.Param} always parses all of the
 * parameters as string type.
 *
 * ```typescript
 * \@TypedRoute.Get("shopping/sales/:section/:id/:paused")
 * public async pause
 *     (
 *         \@TypedParam("section", "string") section: string,
 *         \@TypedParam("id", "number") id: number,
 *         \@TypedParam("paused", "boolean", true) paused: boolean | null
 *     ): Promise<void>;
 * ```
 *
 * @param name URL Parameter name
 * @param type Type of the URL parameter
 * @returns Parameter decorator
 *
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedParam(
    name: string,
    type: "boolean" | "number" | "string" | "uuid" = "string",
    nullable: boolean = false,
) {
    return createParamDecorator(function TypedParam(
        {}: any,
        ctx: ExecutionContext,
    ) {
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
    })(name);
}

const UUID_PATTERN =
    /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
