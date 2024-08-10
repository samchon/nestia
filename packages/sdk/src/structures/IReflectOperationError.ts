import { IOperationMetadata } from "../transformers/IOperationMetadata";

export interface IReflectOperationError {
  file: string;
  class: string;
  function: string | null;
  from: string | null;
  contents: Array<string | IOperationMetadata.IError>;
}
