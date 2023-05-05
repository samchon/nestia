import { BadRequestException } from "@nestjs/common";

import typia, { IValidation, TypeGuardError } from "typia";

import { IRequestBodyValidator } from "../../options/IRequestBodyValidator";
import { TransformError } from "./TransformError";

export const validate_request_body =
    (method: string) =>
    <T>(validator?: IRequestBodyValidator<T>) => {
        if (!validator) return () => TransformError(method);
        else if (validator.type === "assert") return assert(validator.assert);
        else if (validator.type === "is") return is(validator.is);
        else if (validator.type === "validate")
            return validate(validator.validate);
        return () =>
            new Error(
                `Error on nestia.core.${method}(): invalid typed validator.`,
            );
    };

const assert =
    <T>(closure: (data: T) => T) =>
    (data: T) => {
        try {
            closure(data);
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

const is =
    <T>(closure: (data: T) => boolean) =>
    (data: T) => {
        const success: boolean = closure(data);
        return success ? null : new BadRequestException(MESSAGE);
    };

const validate =
    <T>(closure: (data: T) => IValidation<T>) =>
    (data: T) => {
        const result: IValidation<T> = closure(data);
        return result.success
            ? null
            : new BadRequestException({
                  errors: result.errors,
                  message: MESSAGE,
              });
    };

const MESSAGE = "Request body data is not following the promised type.";
