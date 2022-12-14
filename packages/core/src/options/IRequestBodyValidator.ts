import { IValidation } from "typia";

export type IRequestBodyValidator<T> =
    | IRequestBodyValidator.IAssert<T>
    | IRequestBodyValidator.IIs<T>
    | IRequestBodyValidator.IValidate<T>;
export namespace IRequestBodyValidator {
    export interface IAssert<T> {
        type: "assert";
        assert: (input: T) => T;
    }
    export interface IIs<T> {
        type: "is";
        is: (input: T) => boolean;
    }
    export interface IValidate<T> {
        type: "validate";
        validate: (input: T) => IValidation<T>;
    }
}
