import { BadRequestException } from "@nestjs/common";
import typia, { IValidation, TypeGuardError } from "typia";

import { IRequestBodyValidator } from "../../options/IRequestBodyValidator";
import { NoTransformConfigurationError } from "../NoTransformConfigurationError";
import { IRequestBodyValidation } from "./IRequestBodyValidation";

/**
 * Builds the shared body checker while preserving successful callback values.
 *
 * The legacy callable returns an error or null; its resolver returns the same
 * validation decision and the callback's successful data without validating
 * twice. Private assert/is/validate adapters preserve each descriptor's error
 * details. Resolver input is untrusted. The descriptor's existing input:T
 * signature is retained for compatibility; adapters cast at invocation and rely
 * on its validation result before exposing successful T data.
 *
 * @internal
 */
export const validate_request_body =
  (method: string) =>
  <T>(
    validator?: IRequestBodyValidator<T>,
  ): IRequestBodyValidation.IResolved<T> => {
    if (!validator) {
      NoTransformConfigurationError(method);
      return create<T>((input: unknown) => ({
        success: true,
        data: input as T,
      }));
    } else if (validator.type === "assert") return assert(validator.assert);
    else if (validator.type === "is") return is(validator.is);
    else if (validator.type === "validate") return validate(validator.validate);
    return create<T>(() => ({
      success: false,
      error: new Error(
        `Error on nestia.core.${method}(): invalid typed validator.`,
      ),
    }));
  };

/**
 * Resolves factory checkers or the existing error-only metadata protocol once.
 *
 * @internal
 */
export const resolve_request_body = <T>(
  checker: IRequestBodyValidation<T>,
  input: unknown,
): IRequestBodyValidation.IResult<T> => {
  if (checker.resolve) return checker.resolve(input);
  const error = checker(input as T);
  return error === null
    ? { success: true, data: input as T }
    : { success: false, error };
};

/** Installs both protocols on one newly created, session-independent checker. */
const create = <T>(
  resolve: (input: unknown) => IRequestBodyValidation.IResult<T>,
): IRequestBodyValidation.IResolved<T> =>
  Object.assign(
    (input: T): Error | null => {
      const result = resolve(input);
      return result.success ? null : result.error;
    },
    { resolve },
  );

/** @internal */
const assert = <T>(closure: (data: T) => T) =>
  create<T>((input: unknown): IRequestBodyValidation.IResult<T> => {
    try {
      return { success: true, data: closure(input as T) };
    } catch (exp) {
      if (typia.is<TypeGuardError>(exp)) {
        return {
          success: false,
          error: new BadRequestException({
            path: exp.path,
            reason: exp.message,
            expected: exp.expected,
            value: exp.value,
            message: MESSAGE,
          }),
        };
      }
      throw exp;
    }
  });

/** @internal */
const is = <T>(closure: (data: T) => boolean) =>
  create<T>((input: unknown): IRequestBodyValidation.IResult<T> => {
    const success: boolean = closure(input as T);
    return success
      ? { success: true, data: input as T }
      : { success: false, error: new BadRequestException(MESSAGE) };
  });

/** @internal */
const validate = <T>(closure: (data: T) => IValidation<T>) =>
  create<T>((input: unknown): IRequestBodyValidation.IResult<T> => {
    const result: IValidation<T> = closure(input as T);
    return result.success
      ? { success: true, data: result.data }
      : {
          success: false,
          error: new BadRequestException({
            errors: result.errors,
            message: MESSAGE,
          }),
        };
  });

/** @internal */
const MESSAGE = "Request body data is not following the promised type.";
