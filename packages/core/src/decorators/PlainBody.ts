import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";

import { get_text_body } from "./internal/get_text_body";
import { is_media_type } from "./internal/is_media_type";
import { is_request_body_undefined } from "./internal/is_request_body_undefined";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Plain body decorator.
 *
 * `PlainBody` is a decorator function getting full body text from the HTTP
 * request. The transformed assertion's successful string is the decorated
 * argument.
 *
 * If you adjust the regular {@link Body} decorator function to the body
 * parameter, you can't get the full body text because the {@link Body} tries to
 * convert the body text to JSON object. Therefore, `@nestia/core` provides this
 * `PlainBody` decorator function to get the full body text.
 *
 * ```typescript
 * \@TypedRoute.Post("memo")
 * public store
 *     (
 *         \@PlainBody() body: string
 *     ): void;
 * ```
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @returns Parameter decorator
 * @evidence contracts/common.md#principled-implementation The decorator reads text only for text/plain requests; an installed assertion resolves the argument value through the shared body checker, while no assertion retains raw text. Absent input is accepted when its assertion accepts undefined and otherwise continues through the media-type error path.
 * @evidence contracts/common.md#clear-and-simple-design One parameter decorator shares body absence, media recognition, text reading and successful-value resolution with the other request decorators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Text comes from the request parser or shared raw-body reader, not a fabricated value; no runtime controller or body identity is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes full body text from JSON parsing and states that the transformed assertion supplies the argument.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation HTTP text bodies and decoded string values carry no native filesystem or subprocess boundary.
 */
export function PlainBody(): ParameterDecorator;

/**
 * Registers the transformed text assertion and binds its successful value. The
 * public overload accepts no runtime assertion; the transform supplies it.
 */
export function PlainBody(
  assert?: (input: unknown) => string,
): ParameterDecorator {
  const checker = assert
    ? validate_request_body("PlainBody")({
        type: "assert",
        assert,
      })
    : null;
  return createParamDecorator(async function PlainBody(
    _data: any,
    context: ExecutionContext,
  ) {
    const request: express.Request | FastifyRequest = context
      .switchToHttp()
      .getRequest();
    if (is_request_body_undefined(request)) {
      if (checker === null) return undefined;
      const result = checker.resolve(undefined);
      if (result.success) return result.data;
    }
    if (!is_media_type(request.headers["content-type"], "text/plain"))
      throw new BadRequestException(`Request body type is not "text/plain".`);
    const value: string = await get_text_body(request);
    if (checker) {
      const result = checker.resolve(value);
      if (!result.success) throw result.error;
      return result.data;
    }
    return value;
  })();
}
