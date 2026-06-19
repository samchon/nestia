import { IComparable } from "tstl";

import { IOperationMetadata } from "../transformers/IOperationMetadata";

export interface IReflectOperationError {
  file: string;
  class: string;
  function: string | null;
  from: string | null;
  contents: Array<string | IOperationMetadata.IError>;
}
export namespace IReflectOperationError {
  export class Key implements Pick<IComparable<Key>, "less"> {
    public constructor(public readonly error: IReflectOperationError) {}

    public less(obj: Key): boolean {
      if (this.error.file !== obj.error.file)
        return this.error.file < obj.error.file;
      else if (this.error.class !== obj.error.class)
        return this.error.class < obj.error.class;
      else if (this.error.function !== obj.error.function)
        return (this.error.function ?? "") < (obj.error.function ?? "");
      return (this.error.from ?? "") < (obj.error.from ?? "");
    }
  }
}
