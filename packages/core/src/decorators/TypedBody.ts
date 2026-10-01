import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import { IRequestBodyValidator } from "../options/IRequestBodyValidator";
import { is_media_type } from "./internal/is_media_type";
import { is_request_body_undefined } from "./internal/is_request_body_undefined";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Type safe body decorator.
 *
 * `TypedBody` is a decorator function getting `application/json` typed data
 * from request body. Also, it validates the request body data type through
 * [typia](https://github.com/samchon/typia) and the validation speed is maximum
 * 20,000x times faster than `class-validator`.
 *
 * For reference, when the request body data is not following the promised type
 * `T`, `BadRequestException` error (status code: 400) would be thrown.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @param validator Custom validator if required. Default is `typia.validate()`
 * @evidence contracts/common.md#principled-implementation An absent body with no content type is accepted only when the validator accepts `undefined`; any other body must be `application/json`, and the parsed body is checked by the transformed validator, whose error is thrown as the response.
 * @evidence contracts/common.md#clear-and-simple-design One parameter decorator built from the shared media type check, the emptiness check, and the request validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The validator is generated from the type by the transform; without it the decorator throws the configuration error unless the guard is turned off.
 * @evidence contracts/common.md#meaningful-documentation The comment documents the decorator, the media type rule, and the validation modes.
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
    if (is_request_body_undefined(request) && checker(undefined as T) === null)
      return undefined;
    else if (
      is_media_type(request.headers["content-type"], "application/json") ===
      false
    )
      throw new BadRequestException(
        `Request body type is not "application/json".`,
      );

    const error: Error | null = checker(request.body);
    if (error !== null) throw error;
    return request.body;
  })();
}
