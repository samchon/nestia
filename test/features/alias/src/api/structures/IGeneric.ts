import { IGenericBase } from "./IGenericBase";

export type IGeneric = IGenericBase<IGeneric.IMetadata>;
export namespace IGeneric {
  export interface IMetadata {
    value: number;
  }
}
