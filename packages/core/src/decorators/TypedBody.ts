import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import raw from "raw-body";
import { assert, is, validate } from "typia";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Safe body decorator.
 *
 * `TypedBody` is a decorator function getting JSON data from HTTP request. Also,
 * it validates the JSON data type through
 * [`typia.assert()`](https://github.com/samchon/typia#runtime-type-checkers)
 * function and throws `BadRequestException` error (status code: 400), if the JSON
 * data is not following the promised type.
 *
 * @param validator Custom validator if required. Default is `typia.assert()`
 * @author Jeongho Nam - https://github.com/samchon
 */
export function TypedBody<T>(
    validator?: IRequestBodyValidator<T>,
): ParameterDecorator {
    const checker = validate_request_body("TypedBody")(validator);
    return createParamDecorator(async function TypedBody(
        _unknown: any,
        context: ExecutionContext,
    ) {
        const request: express.Request = context.switchToHttp().getRequest();
        if (isApplicationJson(request.headers["content-type"]) === false) {
            throw new BadRequestException(
                "Request body is not the application/json.",
            );
        }
        const data: any = request.body
            ? request.body
            : JSON.parse((await raw(request, "utf8")).trim());
        checker(data);
        return data;
    })();
}

Object.assign(TypedBody, assert);
Object.assign(TypedBody, is);
Object.assign(TypedBody, validate);

const isApplicationJson = (text?: string) =>
    text !== undefined &&
    text
        .split(";")
        .map((str) => str.trim())
        .some((str) => str === "application/json");
