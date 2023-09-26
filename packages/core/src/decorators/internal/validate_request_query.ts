import { BadRequestException } from "@nestjs/common";

import typia, { IValidation, TypeGuardError } from "typia";

import { IRequestQueryValidator } from "../../options/IRequestQueryValidator";
import { NoTransformConfigureError } from "./NoTransformConfigureError";

export const validate_request_query = <T>(
    validator?: IRequestQueryValidator<T>,
) => {
    if (!validator) return () => NoTransformConfigureError("TypedQuery");
    else if (validator.type === "assert") return assert(validator.assert);
    else if (validator.type === "is") return is(validator.is);
    else if (validator.type === "validate") return validate(validator.validate);
    return () =>
        new Error(
            `Error on nestia.core.TypedQuery(): invalid typed validator.`,
        );
};

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

const is =
    <T>(closure: (input: URLSearchParams) => T | null) =>
    (input: URLSearchParams): T | BadRequestException => {
        const result: T | null = closure(input);
        return result !== null ? result : new BadRequestException(MESSAGE);
    };

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

const MESSAGE = "Request query data is not following the promised type.";
