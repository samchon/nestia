import { IJsDocTagInfo } from "typia";
import { Metadata } from "typia/lib/schemas/metadata/Metadata";

import { IReflectType } from "./IReflectType";

export type ITypedHttpRouteParameter =
  | ITypedHttpRouteParameter.IBody
  | ITypedHttpRouteParameter.IHeaders
  | ITypedHttpRouteParameter.IPath
  | ITypedHttpRouteParameter.IQuery;
export namespace ITypedHttpRouteParameter {
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
  export interface IPath extends IBase<"param"> {
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
    metadata: Metadata;
    example?: any;
    examples?: Record<string, any>;
    description: string | null;
    jsDocTags: IJsDocTagInfo[];
  }
}
