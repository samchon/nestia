import type { IJsonComponents } from "./IJsonComponents";

export namespace RecordstringIJsonComponents {
  /**
   * Construct a type with a set of properties K of type T
   */
  export type IAlias = {
    [key: string]: IJsonComponents.IAlias;
  };
}
