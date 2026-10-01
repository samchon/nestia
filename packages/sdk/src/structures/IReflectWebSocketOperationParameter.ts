import { IJsDocTagInfo } from "typia";

import { IReflectImport } from "./IReflectImport";
import { IReflectType } from "./IReflectType";

/**
 * A parameter of a WebSocket operation: an acceptor, a driver, a header, a path
 * parameter, or a query.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by `category`, and a preconfigured form carries what the decorators alone record.
 * @evidence contracts/common.md#clear-and-simple-design A union of five records plus the preconfigured form.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export type IReflectWebSocketOperationParameter =
  | IReflectWebSocketOperationParameter.IAcceptor
  | IReflectWebSocketOperationParameter.IDriver
  | IReflectWebSocketOperationParameter.IHeader
  | IReflectWebSocketOperationParameter.IParam
  | IReflectWebSocketOperationParameter.IQuery;
export namespace IReflectWebSocketOperationParameter {
  /**
   * The parameter category `acceptor` of a WebSocket operation.
   *
   * @evidence contracts/common.md#principled-implementation The alias fixes the category of the shared base.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the category.
   */
  export type IAcceptor = IBase<"acceptor">;
  /**
   * The parameter category `driver` of a WebSocket operation.
   *
   * @evidence contracts/common.md#principled-implementation The alias fixes the category of the shared base.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the category.
   */
  export type IDriver = IBase<"driver">;
  /**
   * The parameter category `header` of a WebSocket operation.
   *
   * @evidence contracts/common.md#principled-implementation The alias fixes the category of the shared base.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the category.
   */
  export type IHeader = IBase<"header">;
  /**
   * The parameter category `query` of a WebSocket operation.
   *
   * @evidence contracts/common.md#principled-implementation The alias fixes the category of the shared base.
   * @evidence contracts/common.md#clear-and-simple-design One alias.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment names the category.
   */
  export type IQuery = IBase<"query">;
  /**
   * A path parameter of a WebSocket operation with its field name.
   *
   * @evidence contracts/common.md#principled-implementation The record adds the field that names the path placeholder to the shared base.
   * @evidence contracts/common.md#clear-and-simple-design A record extending the shared base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IParam extends IBase<"param"> {
    field: string;
  }
  interface IBase<Category extends string> {
    category: Category;
    name: string;
    index: number;
    type: IReflectType;
    imports: IReflectImport[];
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
  }

  /** @internal */
  export interface IPreconfigured {
    category: "acceptor" | "driver" | "header" | "param" | "query";
    index: number;
    field?: string;
  }
}
