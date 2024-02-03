import { IValidation } from "typia";

export interface IRequestMultipartProps<T> {
  files: Array<IRequestMultipartProps.IFile>;
  validator:
    | IRequestMultipartProps.IAssert<T>
    | IRequestMultipartProps.IIs<T>
    | IRequestMultipartProps.IValidate<T>;
}
export namespace IRequestMultipartProps {
  export interface IAssert<T> {
    type: "assert";
    assert: (input: FormData) => T;
  }
  export interface IIs<T> {
    type: "is";
    is: (input: FormData) => T | null;
  }
  export interface IValidate<T> {
    type: "validate";
    validate: (input: FormData) => IValidation<T>;
  }
  export interface IFile {
    name: string;
    limit: number | null;
  }
}
