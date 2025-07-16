import { IJsDocTagInfo } from "typia";

import { IReflectImport } from "./IReflectImport";
import { IReflectType } from "./IReflectType";

export type IReflectWebSocketOperationParameter =
  | IReflectWebSocketOperationParameter.IAcceptor
  | IReflectWebSocketOperationParameter.IDriver
  | IReflectWebSocketOperationParameter.IHeader
  | IReflectWebSocketOperationParameter.IParam
  | IReflectWebSocketOperationParameter.IQuery;
export namespace IReflectWebSocketOperationParameter {
  export type IAcceptor = IBase<"acceptor">;
  export type IDriver = IBase<"driver">;
  export type IHeader = IBase<"header">;
  export type IQuery = IBase<"query">;
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
