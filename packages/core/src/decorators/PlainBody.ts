import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";
import { assert } from "typia";

import { get_text_body } from "./internal/get_text_body";
import { is_request_body_undefined } from "./internal/is_request_body_undefined";
import { validate_request_body } from "./internal/validate_request_body";

/**
 * Plain body decorator.
 *
 * `PlainBody` is a decorator function getting full body text from the HTTP request.
 *
 * If you adjust the regular {@link Body} decorator function to the body parameter,
 * you can't get the full body text because the {@link Body} tries to convert the
 * body text to JSON object. Therefore, `@nestia/core` provides this `PlainBody`
 * decorator function to get the full body text.
 *
 * ```typescript
 * \@TypedRoute.Post("memo")
 * public store
 *     (
 *         \@PlainBody() body: string
 *     ): void;
 * ```
 *
 * @return Parameter decorator
 * @author Jeongho Nam - https://github.com/samchon
 */
export function PlainBody(): ParameterDecorator;

/**
 * @internal
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
    if (
      is_request_body_undefined(request) &&
      (checker ?? (() => null))(undefined as any) === null
    )
      return undefined;
    else if (!isTextPlain(request.headers["content-type"]))
      throw new BadRequestException(`Request body type is not "text/plain".`);
    const value: string = await get_text_body(request);
    if (checker) {
      const error: Error | null = checker(value);
      if (error !== null) throw error;
    }
    return value;
  })();
}
Object.assign(PlainBody, assert);

/**
 * @internal
 */
const isTextPlain = (text?: string): boolean =>
  text !== undefined &&
  text
    .split(";")
    .map((str) => str.trim())
    .some((str) => str === "text/plain");
