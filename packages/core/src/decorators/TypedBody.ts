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
 * Type safe body decorator.
 *
 * `TypedBody` is a decoratur function getting `application/json` typed data from
 * request body. Also, it validates the request body data type through
 * [typia](https://github.com/samchon/typia) and the validation speed is
 * maximum 15,000x times faster than `class-validator`.
 *
 * For reference, when the request body data is not following the promised type `T`,
 * `BadRequestException` error (status code: 400) would be thrown.
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
        if (!request.is("application/json")) {
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
