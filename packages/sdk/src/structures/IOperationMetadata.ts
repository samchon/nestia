import {
  IMetadataComponents,
  IMetadataSchema,
  ValidationPipe,
} from "@typia/interface";
import { IJsDocTagInfo } from "typia";

import { IReflectImport } from "./IReflectImport";
import { IReflectType } from "./IReflectType";

export interface IOperationMetadata {
  parameters: IOperationMetadata.IParameter[];
  success: IOperationMetadata.IResponse;
  exceptions: IOperationMetadata.IResponse[];
  description: string | null;
  jsDocTags: IJsDocTagInfo[];
}
export namespace IOperationMetadata {
  export interface IParameter extends IResponse {
    name: string;
    index: number;
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
  }
  export interface IResponse {
    type: IReflectType | null;
    imports: IReflectImport[];
    primitive: ValidationPipe<ISchema, IError>;
    resolved: ValidationPipe<ISchema, IError>;
  }

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
  export interface IError {
    name: string;
    accessor: string | null;
    messages: string[];
  }
}
