import { OpenApi } from "@typia/interface";
import { IJsDocTagInfo } from "typia";

import { MetadataSchema } from "../internal/legacy";
import { IReflectType } from "./IReflectType";

/**
 * A typed parameter of a route: a body, headers, a path parameter, or a query.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by `category`, and each member carries the resolved metadata.
 * @evidence contracts/common.md#clear-and-simple-design A union of four records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export type ITypedHttpRouteParameter =
  | ITypedHttpRouteParameter.IBody
  | ITypedHttpRouteParameter.IHeaders
  | ITypedHttpRouteParameter.IPath
  | ITypedHttpRouteParameter.IQuery;
export namespace ITypedHttpRouteParameter {
  /**
   * The typed form of a body parameter.
   *
   * @evidence contracts/common.md#principled-implementation The record extends the shared base with the members its category adds.
   * @evidence contracts/common.md#clear-and-simple-design A record extending the shared base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IBody extends IBase<"body"> {
    contentType:
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain";
    encrypted: boolean;
  }
  /**
   * The typed form of a headers parameter.
   *
   * @evidence contracts/common.md#principled-implementation The record extends the shared base with the members its category adds.
   * @evidence contracts/common.md#clear-and-simple-design A record extending the shared base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IHeaders extends IBase<"headers"> {
    field: string | null;
  }
  /**
   * The typed form of a path parameter parameter.
   *
   * @evidence contracts/common.md#principled-implementation The record extends the shared base with the members its category adds.
   * @evidence contracts/common.md#clear-and-simple-design A record extending the shared base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IPath extends IBase<"param"> {
    field: string;
  }
  /**
   * The typed form of a query parameter.
   *
   * @evidence contracts/common.md#principled-implementation The record extends the shared base with the members its category adds.
   * @evidence contracts/common.md#clear-and-simple-design A record extending the shared base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IQuery extends IBase<"query"> {
    field: string | null;
  }

  interface IBase<Category extends string> {
    category: Category;
    name: string;
    index: number;
    type: IReflectType;
    metadata: MetadataSchema;
    example?: any;
    /** Named examples, as OpenAPI Example Objects. */
    examples?: Record<string, OpenApi.IExample>;
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
  }
}
