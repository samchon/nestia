import { IJsDocTagInfo } from "typia";
import { MetadataFactory } from "typia/lib/factories/MetadataFactory";
import { IMetadata } from "typia/lib/schemas/metadata/IMetadata";
import { IMetadataComponents } from "typia/lib/schemas/metadata/IMetadataComponents";

import { IReflectType } from "./IReflectType";

export type IReflectHttpOperationParameter =
  | IReflectHttpOperationParameter.IBody
  | IReflectHttpOperationParameter.IHeaders
  | IReflectHttpOperationParameter.IParam
  | IReflectHttpOperationParameter.IQuery;
export namespace IReflectHttpOperationParameter {
  export interface IBody extends IBase<"body"> {
    contentType:
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data"
      | "text/plain";
    encrypted: boolean;
  }
  export interface IHeaders extends IBase<"headers"> {
    field: string | null;
  }
  export interface IParam extends IBase<"param"> {
    field: string;
  }
  export interface IQuery extends IBase<"query"> {
    field: string | null;
  }
  interface IBase<Category extends string> {
    category: Category;
    name: string;
    index: number;
    type: IReflectType;
    metadata: IMetadata;
    components: IMetadataComponents;
    validate: MetadataFactory.Validator;
    example?: any;
    examples?: Record<string, any>;
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
