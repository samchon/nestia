import { IValidation } from "typia";

export type IRequestHeadersValidator<T> =
    | IRequestHeadersValidator.IAssert<T>
    | IRequestHeadersValidator.IIs<T>
    | IRequestHeadersValidator.IValidate<T>;
export namespace IRequestHeadersValidator {
    export interface IAssert<T> {
        type: "assert";
        assert: (input: Record<string, string | string[] | undefined>) => T;
    }
    export interface IIs<T> {
        type: "is";
        is: (input: Record<string, string | string[] | undefined>) => T | null;
    }
    export interface IValidate<T> {
        type: "validate";
        validate: (
            input: Record<string, string | string[] | undefined>,
        ) => IValidation<T>;
    }
}
