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
 * [typia](https://github.com/samchon/typia) using the declared TypeScript
 * type.
 *
 * For reference, when the request body data is not following the promised type
 * `T`, `BadRequestException` error (status code: 400) would be thrown.
 * Successful assert and validate callbacks supply the decorated argument; clone
 * validators can therefore return a copy without replacing the raw body.
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @param validator Custom validator if required. Default is `typia.validate()`
 * @evidence contracts/common.md#principled-implementation An absent body with no content type is accepted only when the validator accepts undefined; any other body must be application/json. The checker returns explicitly tagged successful data or the existing validation error, so cloned values reach the argument while raw request.body retains its identity and errors retain their response priority.
 * @evidence contracts/common.md#clear-and-simple-design One parameter decorator composes shared media/absence checks and tagged resolution. The shared internal runner owns descriptor selection and error translation; PlainBody uses the same successful-value protocol for its optional transformed text assertion, preserving raw text when no assertion exists and preserving its absent-input/media error priority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The validator is generated from the type by the transform; without it the decorator throws the configuration error unless the guard is turned off.
 * @evidence contracts/common.md#meaningful-documentation The comment documents the decorator, the media type rule, and the validation modes.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation Parsed HTTP bodies and validation callbacks are independent of native filesystem and process representation.
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
    if (is_request_body_undefined(request)) {
      const result = checker.resolve(undefined);
      if (result.success) return result.data;
    }
    if (
      is_media_type(request.headers["content-type"], "application/json") ===
      false
    )
      throw new BadRequestException(
        `Request body type is not "application/json".`,
      );

    const result = checker.resolve(request.body);
    if (!result.success) throw result.error;
    return result.data;
  })();
}
