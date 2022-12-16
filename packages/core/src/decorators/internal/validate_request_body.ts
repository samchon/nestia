import { BadRequestException } from "@nestjs/common";
import { IValidation, TypeGuardError } from "typia";

import { IRequestBodyValidator } from "../../options/IRequestBodyValidator";

export const validate_request_body =
    (method: string) =>
    <T>(validator?: IRequestBodyValidator<T>) => {
        if (!validator)
            throw new Error(
                `Error on nestia.core.${method}(): no transformer.`,
            );
        else if (validator.type === "assert") return assert(validator.assert);
        else if (validator.type === "is") return is(validator.is);
        else if (validator.type === "validate")
            return validate(validator.validate);
        throw new Error(
            `Error on nestia.core.${method}(): invalid typed validator.`,
        );
    };

const assert =
    <T>(closure: (data: T) => T) =>
    (data: T) => {
        try {
            closure(data);
        } catch (exp) {
            if (exp instanceof TypeGuardError) {
                throw new BadRequestException({
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
        if (success === false) throw new BadRequestException(MESSAGE);
    };

const validate =
    <T>(closure: (data: T) => IValidation<T>) =>
    (data: T) => {
        const result: IValidation<T> = closure(data);
        if (result.success === false)
            throw new BadRequestException({
                errors: result.errors,
                message: MESSAGE,
            });
    };

const MESSAGE = "Request body data is not following the promised type.";
