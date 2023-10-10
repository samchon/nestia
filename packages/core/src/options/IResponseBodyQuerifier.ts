import { IValidation } from "typia";

export type IResponseBodyQuerifier<T> =
    | IResponseBodyquerifier.IStringify<T>
    | IResponseBodyquerifier.IIs<T>
    | IResponseBodyquerifier.IAssert<T>
    | IResponseBodyquerifier.IValidate<T>;
export namespace IResponseBodyquerifier {
    export interface IStringify<T> {
        type: "stringify";
        stringify: (input: T) => URLSearchParams;
    }
    export interface IIs<T> {
        type: "is";
        is: (input: T) => URLSearchParams | null;
    }
    export interface IAssert<T> {
        type: "assert";
        assert: (input: T) => URLSearchParams;
    }
    export interface IValidate<T> {
        type: "validate";
        validate: (input: T) => IValidation<URLSearchParams>;
    }
}
