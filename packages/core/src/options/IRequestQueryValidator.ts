import { IValidation } from "typia";

export type IRequestQueryValidator<T> =
    | IRequestQueryValidator.IAssert<T>
    | IRequestQueryValidator.IIs<T>
    | IRequestQueryValidator.IValidate<T>;
export namespace IRequestQueryValidator {
    export interface IAssert<T> {
        type: "assert";
        assert: (input: URLSearchParams) => T;
    }
    export interface IIs<T> {
        type: "is";
        is: (input: URLSearchParams) => T | null;
    }
    export interface IValidate<T> {
        type: "validate";
        validate: (input: URLSearchParams) => IValidation<T>;
    }
}
