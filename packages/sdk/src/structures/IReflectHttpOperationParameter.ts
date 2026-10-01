import {
  IJsDocTagInfo,
  IMetadataComponents,
  IMetadataSchema,
  OpenApi,
} from "@typia/interface";

import { MetadataFactory } from "../internal/legacy";
import { IReflectType } from "./IReflectType";

/**
 * A reflected parameter of an HTTP operation: a body, headers, a path
 * parameter, or a query.
 *
 * @evidence contracts/common.md#principled-implementation The union is discriminated by `category`, with the fields each category needs, and a preconfigured form for what Nest's metadata alone gives.
 * @evidence contracts/common.md#clear-and-simple-design A union of four records plus the preconfigured union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 */
export type IReflectHttpOperationParameter =
  | IReflectHttpOperationParameter.IBody
  | IReflectHttpOperationParameter.IHeaders
  | IReflectHttpOperationParameter.IParam
  | IReflectHttpOperationParameter.IQuery;
export namespace IReflectHttpOperationParameter {
  /**
   * The reflected parameter of a body, with its content type and whether it is
   * encrypted.
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
   * The reflected parameter of the headers, as an object or as one field.
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
   * The reflected parameter of a path parameter with its field name.
   *
   * @evidence contracts/common.md#principled-implementation The record extends the shared base with the members its category adds.
   * @evidence contracts/common.md#clear-and-simple-design A record extending the shared base.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   */
  export interface IParam extends IBase<"param"> {
    field: string;
  }
  /**
   * The reflected parameter of the query, as an object or as one field.
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
    metadata: IMetadataSchema;
    components: IMetadataComponents;

    /**
     * SDK policy checked over the metadata, for a JSON or text body. An HTTP
     * input's wire rules are typia's instead, baked beside its metadata.
     */
    validate?: MetadataFactory.Validator;
    example?: any;
    /** Named examples, as OpenAPI Example Objects. */
    examples?: Record<string, OpenApi.IExample>;
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
  }

  /** @internal */
  export type IPreconfigured =
    | IPreconfigured.IBody
    | IPreconfigured.IHeaders
    | IPreconfigured.IParam
    | IPreconfigured.IQuery;

  /** @internal */
  export namespace IPreconfigured {
    export interface IBody extends IBase<"body"> {
      field?: string;
      encrypted?: boolean;
      contentType:
        | "application/json"
        | "application/x-www-form-urlencoded"
        | "multipart/form-data"
        | "text/plain";
    }
    export interface IHeaders extends IBase<"headers"> {
      field?: string;
    }
    export interface IParam extends IBase<"param"> {
      field?: string;
    }
    export interface IQuery extends IBase<"query"> {
      field?: string;
    }
    interface IBase<Category extends string> {
      category: Category;
      index: number;
    }
  }
}
