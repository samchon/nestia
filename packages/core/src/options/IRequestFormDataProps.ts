import type fastifyMulter from "fastify-multer/lib/interfaces";
import type expressMulter from "multer";
import { IValidation } from "typia";

export interface IRequestFormDataProps<T> {
  files: Array<IRequestFormDataProps.IFile>;
  validator:
    | IRequestFormDataProps.IAssert<T>
    | IRequestFormDataProps.IIs<T>
    | IRequestFormDataProps.IValidate<T>;
  options?: expressMulter.Options | fastifyMulter.Options;
}
export namespace IRequestFormDataProps {
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
