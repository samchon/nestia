import {
    BadRequestException,
    ExecutionContext,
    createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import { assert, is, validate } from "typia";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Type safe body decorator.
 *
 * `TypedBody` is a decorator function getting `application/json` typed data from
 * request body. Also, it validates the request body data type through
 * [typia](https://github.com/samchon/typia) and the validation speed is
 * maximum 20,000x times faster than `class-validator`.
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
    return createParamDecorator(function TypedBody(
        _unknown: any,
        context: ExecutionContext,
    ) {
        const request: express.Request | FastifyRequest = context
            .switchToHttp()
            .getRequest();
        if (isApplicationJson(request.headers["content-type"]) === false)
            throw new BadRequestException(
                `Request body type is not "application/json".`,
            );

        const error: Error | null = checker(request.body);
        if (error !== null) throw error;
        return request.body;
    })();
}

Object.assign(TypedBody, is);
Object.assign(TypedBody, assert);
Object.assign(TypedBody, validate);

const isApplicationJson = (text?: string): boolean =>
    text !== undefined &&
    text
        .split(";")
        .map((str) => str.trim())
        .some((str) => str === "application/json");
