import {
  BadRequestException,
  ExecutionContext,
  createParamDecorator,
} from "@nestjs/common";
import type express from "express";
import type { FastifyRequest } from "fastify";
import typia, { IValidation, TypeGuardError } from "typia";

import { NoTransformConfigurationError } from "./NoTransformConfigurationError";

/**
 * Type safe URL parameter decorator.
 *
 * `TypedParam` is a decorator function getting specific typed parameter from
 * the HTTP request URL. It's almost same with the {@link nest.Param}, but
 * `TypedParam` automatically casts parameter value to be following its type,
 * and validates it.
 *
 * ```typescript
 * import { tags } from "typia";
 *
 * \@TypedRoute.Get("shopping/sales/:id/:no/:paused")
 * public async pause(
 *   \@TypedParam("id") id: string & tags.Format<"uuid">,
 *   \@TypedParam("no") no: number & tags.Type<"uint32">,
 *   \@TypedParam("paused") paused: boolean | null,
 * ): Promise<void>;
 * ```
 *
 * @author Jeongho Nam - https://github.com/samchon
 * @param name URL Parameter name
 * @param assert Conversion and assertion supplied by the compile-time transform
 * @param validate Emit an errors array on validation failure when true;
 *   otherwise expose the first failure as flat path, reason, expected and value
 *   fields.
 * @returns Parameter decorator
 * @evidence contracts/common.md#principled-implementation The path parameter arrives as a string and is converted by the assertion function the transform generated for the declared type, so a value of the wrong type produces a 400 that names the parameter; the `validate` flag only changes the error body from the flat form to an `errors` array.
 * @evidence contracts/common.md#clear-and-simple-design One decorator with one conversion function and one error-shaping branch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The conversion is generated from the declared type; without the transform the raw string is returned only when the configuration guard is off.
 * @evidence contracts/common.md#meaningful-documentation The comment documents the supported types and the two error shapes.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation The named path segment is an HTTP route parameter whose text is decoded by the generated validator; no native path is resolved.
 */
export function TypedParam<T extends boolean | bigint | number | string | null>(
  name: string,
  assert?: (value: string) => T,
  validate?: boolean,
): ParameterDecorator {
  if (assert === undefined) {
    NoTransformConfigurationError("TypedParam");
    assert = (value) => value as T;
  }

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
      if (typia.is<TypeGuardError>(exp)) {
        const trace: IValidation.IError = {
          path: exp.path ?? "$input",
          expected: exp.expected,
          value: exp.value,
        };
        throw new BadRequestException({
          message: `Invalid URL parameter value on "${name}".`,
          ...(validate === true
            ? {
                errors: [trace],
              }
            : {
                ...trace,
                reason: exp.message,
              }),
        });
      }
      throw exp;
    }
  })(name);
}
