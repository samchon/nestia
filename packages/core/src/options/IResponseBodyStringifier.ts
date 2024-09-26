import { IValidation } from "typia";

export type IResponseBodyStringifier<T> =
  | IResponseBodyStringifier.IStringify<T>
  | IResponseBodyStringifier.IIs<T>
  | IResponseBodyStringifier.IAssert<T>
  | IResponseBodyStringifier.IValidate<T>
  | IResponseBodyStringifier.IValidateLog<T>;
export namespace IResponseBodyStringifier {
  export interface IStringify<T> {
    type: "stringify";
    stringify: (input: T) => string;
  }
  export interface IIs<T> {
    type: "is";
    is: (input: T) => string | null;
  }
  export interface IAssert<T> {
    type: "assert";
    assert: (input: T) => string;
  }
  export interface IValidate<T> {
    type: "validate";
    validate: (input: T) => IValidation<string>;
  }
  export interface IValidateLog<T> {
    type: "validate.log" | "validateEquals.log";
    validate: (input: T) => IValidation<T>;
  }
}
