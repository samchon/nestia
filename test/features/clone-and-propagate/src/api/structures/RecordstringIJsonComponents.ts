import type { IJsonComponents } from "./IJsonComponents";

export namespace RecordstringIJsonComponents {
  /**
   * Construct a type with a set of properties K of type T
   */
  export type IAlias =
    /**
     * Construct a type with a set of properties K of type T
     */
    {
      [key: string]: IJsonComponents.IAlias;
    };
}
