import { BadRequestException } from "@nestjs/common";
import typia, { IValidation, TypeGuardError } from "typia";

import { IRequestFormDataProps } from "../../options/IRequestFormDataProps";
import { NoTransformConfigureError } from "./NoTransformConfigureError";

/**
 * @internal
 */
export const validate_request_form_data = <T>(
  props?: IRequestFormDataProps<T>,
) => {
  if (!props) return () => NoTransformConfigureError("TypedFormData.Bpdu");
  else if (props.validator.type === "assert")
    return assert(props.validator.assert);
  else if (props.validator.type === "is") return is(props.validator.is);
  else if (props.validator.type === "validate")
    return validate(props.validator.validate);
  return () =>
    new Error(
      `Error on nestia.core.TypedFormData.Body(): invalid typed validator.`,
    );
};

/**
 * @internal
 */
const assert =
  <T>(closure: (input: FormData) => T) =>
  (input: FormData): T | BadRequestException => {
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
  <T>(closure: (input: FormData) => T | null) =>
  (input: FormData): T | BadRequestException => {
    const result: T | null = closure(input);
    return result !== null ? result : new BadRequestException(MESSAGE);
  };

/**
 * @internal
 */
const validate =
  <T>(closure: (input: FormData) => IValidation<T>) =>
  (input: FormData): T | BadRequestException => {
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
const MESSAGE = "Request multipart data is not following the promised type.";
