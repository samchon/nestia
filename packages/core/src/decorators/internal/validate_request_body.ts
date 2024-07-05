import { BadRequestException } from "@nestjs/common";
import typia, { IValidation, TypeGuardError } from "typia";

import { IRequestBodyValidator } from "../../options/IRequestBodyValidator";
import { NoTransformConfigureError } from "./NoTransformConfigureError";

/**
 * @internal
 */
export const validate_request_body =
  (method: string) =>
  <T>(validator?: IRequestBodyValidator<T>) => {
    if (!validator) return NoTransformConfigureError(method);
    else if (validator.type === "assert") return assert(validator.assert);
    else if (validator.type === "is") return is(validator.is);
    else if (validator.type === "validate") return validate(validator.validate);
    return () =>
      new Error(`Error on nestia.core.${method}(): invalid typed validator.`);
  };

/**
 * @internal
 */
const assert =
  <T>(closure: (data: T) => T) =>
  (input: T) => {
    try {
      closure(input);
      return null;
    } catch (exp) {
      if (typia.is<TypeGuardError>(exp)) {
        return new BadRequestException({
          path: exp.path,
          reason: exp.message,
          expected: exp.expected,
          value: exp.value,
          message: MESSAGE,
        });
      }
      throw exp;
    }
  };

/**
 * @internal
 */
const is =
  <T>(closure: (data: T) => boolean) =>
  (input: T) => {
    const success: boolean = closure(input);
    return success ? null : new BadRequestException(MESSAGE);
  };

/**
 * @internal
 */
const validate =
  <T>(closure: (data: T) => IValidation<T>) =>
  (input: T) => {
    const result: IValidation<T> = closure(input);
    return result.success
      ? null
      : new BadRequestException({
          errors: result.errors,
          message: MESSAGE,
        });
  };

/**
 * @internal
 */
const MESSAGE = "Request body data is not following the promised type.";
