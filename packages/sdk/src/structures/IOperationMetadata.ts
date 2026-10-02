import {
  IMetadataComponents,
  IMetadataSchema,
  ValidationPipe,
} from "@typia/interface";
import { IJsDocTagInfo } from "typia";

import { IReflectImport } from "./IReflectImport";
import { IReflectType } from "./IReflectType";

/**
 * The compile-time metadata of an operation: its parameters, its success, its
 * exceptions, its description, and its JSDoc tags.
 *
 * @evidence contracts/common.md#principled-implementation The record is what the nestia transform serializes into the `OperationMetadata` decorator and the analyzers read back.
 * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
 * @evidenceExclude contracts/portability.md#os-neutral-implementation IOperationMetadata describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
 */
export interface IOperationMetadata {
  parameters: IOperationMetadata.IParameter[];
  success: IOperationMetadata.IResponse;
  exceptions: IOperationMetadata.IResponse[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}
export namespace IOperationMetadata {
  /**
   * The metadata of a parameter: the response fields plus its name, position,
   * description, and tags.
   *
   * @evidence contracts/common.md#principled-implementation A parameter has the type facts of a response and the identity facts of a declaration.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IOperationMetadata.IParameter describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
   */
  export interface IParameter extends IResponse {
    name: string;
    index: number;
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
  }
  /**
   * The metadata of a value: its reflected type, its imports, and its schemas
   * in the primitive and the resolved forms.
   *
   * @evidence contracts/common.md#principled-implementation Each form is either a schema or the list of errors that made it unavailable, so an unreadable type is reported instead of dropped.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IOperationMetadata.IResponse describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
   */
  export interface IResponse {
    type: IReflectType | null;
    imports: IReflectImport[];
    primitive: ValidationPipe<ISchema, IError>;
    resolved: ValidationPipe<ISchema, IError>;
  }

  /**
   * A schema: the components, the metadata, and the wire rule violations of the
   * type.
   *
   * @evidence contracts/common.md#principled-implementation The components and the metadata describe the type and the HTTP rules record why it cannot travel as a query, a header, a path segment, or a form.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IOperationMetadata.ISchema describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
   */
  export interface ISchema {
    components: IMetadataComponents;
    metadata: IMetadataSchema;

    /**
     * Violations of each HTTP input's wire rules, baked on the resolved schema
     * of a route parameter only; the SDK picks the one its decorator selects.
     */
    http?: IHttpRules;
  }

  /**
   * The violations of each HTTP input category's rules, which are typia's own
   * validators except the path parameter rule typia keeps unexported and the
   * one of a field-named `@Query("key")` or `@Headers("key")`.
   *
   * @evidence contracts/common.md#principled-implementation One list per input kind lets the parameter analysis pick the list that applies.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IOperationMetadata.IHttpRules describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
   */
  export interface IHttpRules {
    /** A query object: `@TypedQuery()`, `@Query()`, `@TypedQuery.Body()`. */
    query: IError[];

    /** A headers object: `@TypedHeaders()`, `@Headers()`. */
    headers: IError[];

    /** A path parameter: `@TypedParam("key")`, `@Param("key")`. */
    param: IError[];

    /** One query key or header: `@Query("key")`, `@Headers("key")`. */
    field: IError[];

    /** A multipart body: `@TypedFormData.Body()`. */
    formData: IError[];
  }
  /**
   * One analysis error: the name, the accessor of the member, and the messages.
   *
   * @evidence contracts/common.md#principled-implementation The three members identify where in a type the error is.
   * @evidence contracts/common.md#clear-and-simple-design A flat record with no behavior.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It is a type and adds no runtime behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states what the type describes; its members are named for their meaning.
   * @evidenceExclude contracts/portability.md#os-neutral-implementation IOperationMetadata.IError describes protocol or type metadata; any embedded import/source record preserves the identity supplied by its owner. This declaration defines no native path conversion or process boundary.
   */
  export interface IError {
    name: string;
    accessor: string | null;
    messages: string[];
  }
}
