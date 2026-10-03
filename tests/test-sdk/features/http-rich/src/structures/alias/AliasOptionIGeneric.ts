import { AliasOptionIGenericBase } from "./AliasOptionIGenericBase";

export type AliasOptionIGeneric =
  AliasOptionIGenericBase<AliasOptionIGeneric.IMetadata>;
export namespace AliasOptionIGeneric {
  export interface IMetadata {
    value: number;
  }
}
