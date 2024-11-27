import { BadRequestException } from "@nestjs/common";
import typia, { IValidation, TypeGuardError } from "typia";

import { IRequestQueryValidator } from "../../options/IRequestQueryValidator";
import { NoTransformConfigurationError } from "../NoTransformConfigurationError";

/**
 * @internal
 */
export const validate_request_query =
  (method: string) =>
  <T>(validator?: IRequestQueryValidator<T>) => {
    if (!validator) {
      NoTransformConfigurationError(method);
      return (input: URLSearchParams) =>
        Object.fromEntries(input.entries()) as T;
    } else if (validator.type === "assert") return assert(validator.assert);
    else if (validator.type === "is") return is(validator.is);
    else if (validator.type === "validate") return validate(validator.validate);
    return () =>
      new Error(`Error on nestia.core.${method}(): invalid typed validator.`);
  };

/**
 * @internal
 */
const assert =
  <T>(closure: (input: URLSearchParams) => T) =>
  (input: URLSearchParams): T | BadRequestException => {
    try {
      return closure(input);
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
  <T>(closure: (input: URLSearchParams) => T | null) =>
  (input: URLSearchParams): T | BadRequestException => {
    const result: T | null = closure(input);
    return result !== null ? result : new BadRequestException(MESSAGE);
  };

/**
 * @internal
 */
const validate =
  <T>(closure: (input: URLSearchParams) => IValidation<T>) =>
  (input: URLSearchParams): T | BadRequestException => {
    const result: IValidation<T> = closure(input);
    return result.success
      ? result.data
      : new BadRequestException({
          errors: result.errors,
          message: MESSAGE,
        });
  };

/**
 * @internal
 */
const MESSAGE = "Request query data is not following the promised type.";
